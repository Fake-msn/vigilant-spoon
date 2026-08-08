"""RAG 知识库测试：分块 / 余弦 / 入库检索 / 管理员接口。"""

import sqlite3
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient
from pytest import MonkeyPatch

from app.config import settings
from app.main import app
from app.services import rag

client = TestClient(app)


def _seed_db(db_path: str) -> None:
    conn = sqlite3.connect(db_path)
    try:
        from scripts.seed import seed

        seed(conn)
    finally:
        conn.close()


def _admin_token(db_path: str) -> str:
    resp = client.post("/api/admin/login", json={"password": settings.admin_password})
    assert resp.status_code == 200
    return resp.json()["session_token"]


def _use_db(monkeypatch: MonkeyPatch) -> str:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    monkeypatch.setattr(settings, "database_path", db_path)
    _seed_db(db_path)
    return db_path


def test_chunk_text_splits_long_text() -> None:
    text = "字" * 500
    chunks = rag._chunk_text(text)
    assert len(chunks) > 1
    # 相邻块应重叠（切分不截断语义）
    assert chunks[0][-rag.CHUNK_OVERLAP:] == chunks[1][: rag.CHUNK_OVERLAP]


def test_chunk_text_short_stays_single() -> None:
    assert rag._chunk_text("你好") == ["你好"]


def test_cosine_similarity() -> None:
    assert abs(rag._cosine([1.0, 0.0], [1.0, 0.0]) - 1.0) < 1e-9
    assert abs(rag._cosine([1.0, 0.0], [0.0, 1.0])) < 1e-9
    assert rag._cosine([], []) == 0.0


def test_add_document_noop_when_embedding_disabled(monkeypatch: MonkeyPatch) -> None:
    db_path = _use_db(monkeypatch)
    try:
        # 默认 embed_provider=disabled，入库应返回 None 且不落库
        assert rag.add_document("t", "hello world") is None
        assert rag.count_documents() == (0, 0)
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_add_search_remove_document(monkeypatch: MonkeyPatch) -> None:
    db_path = _use_db(monkeypatch)
    # 用确定性假向量模拟 embedding，避免真实网络调用
    monkeypatch.setattr(
        rag,
        "_embed_texts",
        lambda texts: [[1.0 if "dream" in t or "梦想" in t else 0.0, 1.0] for t in texts],
    )
    try:
        doc_id = rag.add_document("梦想教育", "引导学生说出具体理想", category="lesson")
        assert doc_id
        assert rag.count_documents() == (1, 1)

        # 检索应命中相关分块
        results = rag.search("梦想 理想", top_k=1, category="lesson")
        assert results and results[0]["doc_id"] == doc_id

        # 分类过滤：comment 分类下应无结果
        assert rag.search("dream", top_k=1, category="comment") == []

        # 删除后文档数为 0
        assert rag.remove_document(doc_id)
        assert rag.count_documents() == (0, 0)
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_knowledge_endpoints_require_auth(monkeypatch: MonkeyPatch) -> None:
    db_path = _use_db(monkeypatch)
    try:
        assert client.get("/api/admin/knowledge").status_code == 401
        assert client.get("/api/admin/knowledge/status").status_code == 401
        assert client.post("/api/admin/knowledge", json={}).status_code == 401
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_knowledge_list_and_seed(monkeypatch: MonkeyPatch) -> None:
    db_path = _use_db(monkeypatch)
    monkeypatch.setattr(
        rag,
        "_embed_texts",
        lambda texts: [[0.5, 0.5] for _ in texts],
    )
    monkeypatch.setattr(rag, "embedding_configured", lambda: True)
    try:
        token = _admin_token(db_path)
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.post("/api/admin/knowledge/seed", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == len(rag.DEFAULT_CORPUS)

        # 幂等：再次 seed 不新增
        resp = client.post("/api/admin/knowledge/seed", headers=headers)
        assert resp.json()["total"] == len(rag.DEFAULT_CORPUS)

        # 状态接口
        resp = client.get("/api/admin/knowledge/status", headers=headers)
        data = resp.json()
        assert data["doc_count"] == len(rag.DEFAULT_CORPUS)
        assert data["embed_provider"] == "disabled"  # 默认未配置
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_knowledge_create_and_delete(monkeypatch: MonkeyPatch) -> None:
    db_path = _use_db(monkeypatch)
    monkeypatch.setattr(
        rag,
        "_embed_texts",
        lambda texts: [[0.2, 0.8] for _ in texts],
    )
    try:
        token = _admin_token(db_path)
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.post(
            "/api/admin/knowledge",
            headers=headers,
            json={
                "title": "测试文档",
                "content": "这是一段用于测试的知识正文",
                "category": "general",
            },
        )
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert any(i["title"] == "测试文档" for i in items)
        doc_id = next(i["doc_id"] for i in items if i["title"] == "测试文档")

        resp = client.delete(f"/api/admin/knowledge/{doc_id}", headers=headers)
        assert resp.status_code == 200
        assert all(i["doc_id"] != doc_id for i in resp.json()["items"])
    finally:
        Path(db_path).unlink(missing_ok=True)
