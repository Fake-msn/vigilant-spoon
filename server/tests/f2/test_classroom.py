"""F2 classroom control checks (R11, R12, R13)."""

import sqlite3
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient
from pytest import MonkeyPatch

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


def _teacher_token(db_path: str, class_code: str = "LTZ2024", name: str = "李老师") -> str:
    """Obtain a demo teacher token via the API."""
    response = client.post(
        "/api/session/teacher/enter",
        json={"class_code": class_code, "teacher_name": name},
    )
    assert response.status_code == 200
    return str(response.json()["session_token"])


def _student_token(db_path: str, name: str = "王小雅") -> str:
    response = client.post(
        "/api/session/enter",
        json={"class_code": "LTZ2024", "student_name": name},
    )
    assert response.status_code == 200
    return str(response.json()["session_token"])


def test_r13_status_before_start_is_idle(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_token(db_path)

        response = client.get(
            "/api/classes/LTZ2024/session/status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == "cls-LTZ2024"
        assert data["state"] == "idle"
        assert data["current_student"] is None
        assert data["turn_count"] == 0
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r11_start_class_by_teacher_returns_active(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_token(db_path)

        response = client.post(
            "/api/classes/LTZ2024/session/start",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["state"] == "active"
        assert data["current_student"] == "cxy"
        assert data["turn_count"] == 1
        assert data["session_id"] == "cls-LTZ2024"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r11_start_class_is_idempotent(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_token(db_path)

        r1 = client.post(
            "/api/classes/LTZ2024/session/start",
            headers={"Authorization": f"Bearer {token}"},
        )
        r2 = client.post(
            "/api/classes/LTZ2024/session/start",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1.json()["turn_count"] == r2.json()["turn_count"]
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r12_control_pause_and_resume(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_token(db_path)

        client.post(
            "/api/classes/LTZ2024/session/start",
            headers={"Authorization": f"Bearer {token}"},
        )

        pause = client.post(
            "/api/classes/LTZ2024/session/control",
            headers={"Authorization": f"Bearer {token}"},
            json={"action": "pause", "client_cmd_id": "cmd-1"},
        )
        assert pause.status_code == 200
        assert pause.json()["state"] == "paused"

        resume = client.post(
            "/api/classes/LTZ2024/session/control",
            headers={"Authorization": f"Bearer {token}"},
            json={"action": "resume", "client_cmd_id": "cmd-2"},
        )
        assert resume.status_code == 200
        assert resume.json()["state"] == "active"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r12_control_next_student_advances_and_cycles(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_token(db_path)

        client.post(
            "/api/classes/LTZ2024/session/start",
            headers={"Authorization": f"Bearer {token}"},
        )

        next1 = client.post(
            "/api/classes/LTZ2024/session/control",
            headers={"Authorization": f"Bearer {token}"},
            json={"action": "next_student", "client_cmd_id": "cmd-1"},
        )
        assert next1.json()["current_student"] == "lxh"
        assert next1.json()["turn_count"] == 2

        # Cycle through remaining 7 students to return to the first one.
        for i in range(2, 9):
            client.post(
                "/api/classes/LTZ2024/session/control",
                headers={"Authorization": f"Bearer {token}"},
                json={"action": "next_student", "client_cmd_id": f"cmd-{i}"},
            )

        status = client.get(
            "/api/classes/LTZ2024/session/status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert status.json()["current_student"] == "cxy"
        assert status.json()["turn_count"] == 9
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r12_control_switch_content(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_token(db_path)

        client.post(
            "/api/classes/LTZ2024/session/start",
            headers={"Authorization": f"Bearer {token}"},
        )

        response = client.post(
            "/api/classes/LTZ2024/session/control",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "action": "switch_content",
                "client_cmd_id": "cmd-slot",
                "payload": {"slot": "主题讨论"},
            },
        )
        assert response.status_code == 200
        assert response.json()["current_slot"] == "主题讨论"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r12_duplicate_client_cmd_id_is_idempotent(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_token(db_path)

        client.post(
            "/api/classes/LTZ2024/session/start",
            headers={"Authorization": f"Bearer {token}"},
        )

        payload = {"action": "next_student", "client_cmd_id": "dup-1"}
        r1 = client.post(
            "/api/classes/LTZ2024/session/control",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
        )
        r2 = client.post(
            "/api/classes/LTZ2024/session/control",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
        )
        assert r1.json()["turn_count"] == r2.json()["turn_count"]
        assert r1.json()["current_student"] == r2.json()["current_student"]
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r12_control_without_start_returns_409(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_token(db_path)

        response = client.post(
            "/api/classes/LTZ2024/session/control",
            headers={"Authorization": f"Bearer {token}"},
            json={"action": "pause", "client_cmd_id": "cmd-1"},
        )
        assert response.status_code == 409
        assert response.json()["code"] == "ILLEGAL_STATE"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r12_illegal_state_transitions_return_409(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_token(db_path)

        client.post(
            "/api/classes/LTZ2024/session/start",
            headers={"Authorization": f"Bearer {token}"},
        )

        resume_active = client.post(
            "/api/classes/LTZ2024/session/control",
            headers={"Authorization": f"Bearer {token}"},
            json={"action": "resume", "client_cmd_id": "cmd-1"},
        )
        assert resume_active.status_code == 409

        client.post(
            "/api/classes/LTZ2024/session/control",
            headers={"Authorization": f"Bearer {token}"},
            json={"action": "pause", "client_cmd_id": "cmd-2"},
        )

        pause_paused = client.post(
            "/api/classes/LTZ2024/session/control",
            headers={"Authorization": f"Bearer {token}"},
            json={"action": "pause", "client_cmd_id": "cmd-3"},
        )
        assert pause_paused.status_code == 409
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_classroom_endpoints_require_auth(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)

        status = client.get("/api/classes/LTZ2024/session/status")
        assert status.status_code == 401

        start = client.post("/api/classes/LTZ2024/session/start")
        assert start.status_code == 401

        control = client.post(
            "/api/classes/LTZ2024/session/control",
            json={"action": "pause", "client_cmd_id": "cmd-1"},
        )
        assert control.status_code == 401
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_classroom_endpoints_reject_mismatched_class(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_token(db_path)

        response = client.get(
            "/api/classes/OTHER/session/status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        assert response.json()["code"] == "CLASS_NOT_FOUND"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_classroom_unknown_class_returns_404(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_token(db_path)

        response = client.get(
            "/api/classes/UNKNOWN/session/status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        assert response.json()["code"] == "CLASS_NOT_FOUND"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_student_can_access_classroom_status(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _student_token(db_path)

        response = client.get(
            "/api/classes/LTZ2024/session/status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["state"] == "idle"
    finally:
        Path(db_path).unlink(missing_ok=True)
