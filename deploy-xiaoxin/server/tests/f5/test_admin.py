"""方案 5.3：管理员后台配置接口测试。"""

import sqlite3
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient
from pytest import MonkeyPatch

from app.config import settings
from app.main import app
from scripts.seed import seed

client = TestClient(app)


def _seed_db(db_path: str) -> None:
    conn = sqlite3.connect(db_path)
    try:
        seed(conn)
    finally:
        conn.close()


def _admin_token(db_path: str) -> str:
    resp = client.post("/api/admin/login", json={"password": settings.admin_password})
    assert resp.status_code == 200
    token = resp.json()["session_token"]
    assert isinstance(token, str)
    return token


def test_admin_login_wrong_password_returns_401(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    monkeypatch.setattr(settings, "database_path", db_path)
    try:
        _seed_db(db_path)
        resp = client.post("/api/admin/login", json={"password": "wrong"})
        assert resp.status_code == 401
        assert resp.json()["code"] == "INVALID_PASSWORD"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_admin_login_ok_returns_ad_token(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    monkeypatch.setattr(settings, "database_path", db_path)
    try:
        _seed_db(db_path)
        token = _admin_token(db_path)
        assert token.startswith("ad_")
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_admin_config_requires_auth(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    monkeypatch.setattr(settings, "database_path", db_path)
    try:
        _seed_db(db_path)
        resp = client.get("/api/admin/config")
        assert resp.status_code == 401
        assert resp.json()["code"] == "TOKEN_INVALID"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_admin_get_config_returns_env_defaults(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    monkeypatch.setattr(settings, "database_path", db_path)
    try:
        _seed_db(db_path)
        token = _admin_token(db_path)
        resp = client.get(
            "/api/admin/config",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["text_provider"] == "template"
        assert data["image_provider"] == "placeholder"
        assert data["voice_provider"] == "local"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_admin_update_config_persists(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    monkeypatch.setattr(settings, "database_path", db_path)
    try:
        _seed_db(db_path)
        token = _admin_token(db_path)
        headers = {"Authorization": f"Bearer {token}"}
        resp = client.put(
            "/api/admin/config",
            headers=headers,
            json={"text_provider": "dashscope", "text_api_key": "sk-test"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["text_provider"] == "dashscope"
        assert data["text_api_key"] == "sk-test"

        # 再次读取应保持
        resp = client.get("/api/admin/config", headers=headers)
        assert resp.json()["text_provider"] == "dashscope"
        assert resp.json()["text_api_key"] == "sk-test"
    finally:
        Path(db_path).unlink(missing_ok=True)


def _register_teacher(name: str, password: str | None = None) -> None:
    resp = client.post(
        "/api/session/teacher/register",
        json={"name": name, "school": "某学校", "password": password or None},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "pending"


def test_new_teacher_cannot_login_before_admin_approval(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    monkeypatch.setattr(settings, "database_path", db_path)
    try:
        _seed_db(db_path)
        _register_teacher("赵老师", "secret123")
        resp = client.post(
            "/api/session/teacher/enter",
            json={"class_code": "LTZ2024", "teacher_name": "赵老师", "password": "secret123"},
        )
        assert resp.status_code == 403
        assert resp.json()["code"] == "TEACHER_PENDING_REVIEW"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_admin_pending_list_and_approve_flow(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    monkeypatch.setattr(settings, "database_path", db_path)
    try:
        _seed_db(db_path)
        _register_teacher("钱老师", "secret123")
        token = _admin_token(db_path)
        headers = {"Authorization": f"Bearer {token}"}

        # 待审列表应包含钱老师
        resp = client.get("/api/admin/teachers/pending", headers=headers)
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert any(i["teacher_id"] == "teacher-钱老师" for i in items)

        # 通过后即可登录
        resp = client.post(
            "/api/admin/teachers/teacher-钱老师/review",
            headers=headers,
            json={"approve": True},
        )
        assert resp.status_code == 200
        assert all(i["teacher_id"] != "teacher-钱老师" for i in resp.json()["items"])

        resp = client.post(
            "/api/session/teacher/enter",
            json={"class_code": "LTZ2024", "teacher_name": "钱老师", "password": "secret123"},
        )
        assert resp.status_code == 200
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_admin_reject_teacher_blocks_login(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    monkeypatch.setattr(settings, "database_path", db_path)
    try:
        _seed_db(db_path)
        _register_teacher("孙老师")
        token = _admin_token(db_path)
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.post(
            "/api/admin/teachers/teacher-孙老师/review",
            headers=headers,
            json={"approve": False, "reject_reason": "信息不完整"},
        )
        assert resp.status_code == 200

        resp = client.post(
            "/api/session/teacher/enter",
            json={"class_code": "LTZ2024", "teacher_name": "孙老师"},
        )
        assert resp.status_code == 403
        assert resp.json()["code"] == "TEACHER_REJECTED"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_admin_pending_requires_auth(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    monkeypatch.setattr(settings, "database_path", db_path)
    try:
        _seed_db(db_path)
        resp = client.get("/api/admin/teachers/pending")
        assert resp.status_code == 401
        assert resp.json()["code"] == "TOKEN_INVALID"
    finally:
        Path(db_path).unlink(missing_ok=True)
