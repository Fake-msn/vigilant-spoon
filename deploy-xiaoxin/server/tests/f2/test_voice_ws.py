"""F2 voice WebSocket endpoint checks."""

import sqlite3
import tempfile

import pytest
from fastapi.testclient import TestClient
from pytest import MonkeyPatch
from starlette.websockets import WebSocketDisconnect

from app.config import settings
from app.db.migrate import migrate_up
from app.main import app
from scripts.seed import seed

client = TestClient(app)


def _seed_db(db_path: str) -> None:
    conn = sqlite3.connect(db_path)
    try:
        seed(conn)
        migrate_up(conn)
    finally:
        conn.close()


def _student_token(name: str = "王小雅") -> str:
    response = client.post(
        "/api/session/enter",
        json={"class_code": "LTZ2024", "student_name": name},
    )
    assert response.status_code == 200
    return str(response.json()["session_token"])


def test_ws_voice_unauthorized(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)
    _seed_db(db_path)

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/api/ws/voice?token=invalid") as ws:
            ws.receive_json()


def test_ws_voice_events_flow(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)
    _seed_db(db_path)

    token = _student_token("王小雅")
    url = f"/api/ws/voice?token={token}&student_id=wxy&mode=classroom"

    with client.websocket_connect(url) as ws:
        events = []
        for _ in range(50):
            msg = ws.receive_json()
            events.append(msg)
            if msg.get("type") == "session_end":
                break

        types = [e.get("type") for e in events]
        assert "session_started" in types
        assert "transcript" in types
        assert "turn_end" in types
        assert "session_end" in types
