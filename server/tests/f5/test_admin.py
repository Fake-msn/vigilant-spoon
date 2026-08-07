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
