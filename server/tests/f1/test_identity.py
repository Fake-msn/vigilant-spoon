"""F1 identity / session checks (R1, R2, auth)."""

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


def test_r1_get_class_returns_students(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        response = client.get("/api/classes/LTZ2024")
        assert response.status_code == 200
        data = response.json()
        assert data["class_code"] == "LTZ2024"
        assert data["class_name"] == "三（1）班"
        assert data["school"] == "龙头山镇中心小学"
        assert data["region_key"] == "yunnan"
        assert data["region_name"] == "云南山区"
        assert data["grade"] == "三年级"
        assert data["class_no"] == "1"
        assert len(data["students"]) == 8

        first = data["students"][0]
        assert first["id"] == "wxy"
        assert first["name"] == "王小雅"
        assert first["student_no"] == "2023001"
        assert first["role"] == "member"
        assert "avatar_seed" in first
        assert "grade" in first
        assert "region_key" in first
        assert "region_name" in first
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r1_get_class_unknown_returns_404(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        response = client.get("/api/classes/UNKNOWN")
        assert response.status_code == 404
        data = response.json()
        assert data["code"] == "CLASS_NOT_FOUND"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r2_enter_valid_student_returns_token(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        response = client.post(
            "/api/session/enter",
            json={"class_code": "LTZ2024", "student_name": "王小雅"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["session_token"].startswith("st_")
        assert data["profile"]["id"] == "wxy"
        assert data["profile"]["name"] == "王小雅"
        assert "expires_at" in data
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r2_enter_unknown_class_returns_404(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        response = client.post(
            "/api/session/enter",
            json={"class_code": "UNKNOWN", "student_name": "王小雅"},
        )
        assert response.status_code == 404
        data = response.json()
        assert data["code"] == "CLASS_NOT_FOUND"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_r2_enter_unknown_student_returns_404_with_candidates(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        response = client.post(
            "/api/session/enter",
            json={"class_code": "LTZ2024", "student_name": "不存在"},
        )
        assert response.status_code == 404
        data = response.json()
        assert data["code"] == "STUDENT_NOT_FOUND"
        assert "王小雅" in data["details"]["candidates"]
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_auth_valid_token_accesses_protected_route(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        enter_response = client.post(
            "/api/session/enter",
            json={"class_code": "LTZ2024", "student_name": "王小雅"},
        )
        token = enter_response.json()["session_token"]

        response = client.get(
            "/api/students/wxy/growth",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_auth_missing_token_returns_401(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        response = client.get("/api/students/wxy/growth")
        assert response.status_code == 401
        data = response.json()
        assert data["code"] == "TOKEN_INVALID"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_auth_invalid_token_returns_401(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        response = client.get(
            "/api/students/wxy/growth",
            headers={
                "Authorization": "Bearer st_invalidtoken1234567890123456789012345678901234567890"
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["code"] == "TOKEN_INVALID"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_auth_expired_token_returns_401_expired(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        conn = sqlite3.connect(db_path)
        try:
            conn.execute(
                "INSERT INTO sessions (token, student_id, class_code, issued_at, expires_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    "st_expiredtoken12345678901234567890123456789012345678",
                    "wxy",
                    "LTZ2024",
                    "2026-01-01T00:00:00+00:00",
                    "2026-01-01T01:00:00+00:00",
                ),
            )
            conn.commit()
        finally:
            conn.close()

        response = client.get(
            "/api/students/wxy/growth",
            headers={
                "Authorization": "Bearer st_expiredtoken12345678901234567890123456789012345678"
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["code"] == "TOKEN_EXPIRED"
    finally:
        Path(db_path).unlink(missing_ok=True)


def _teacher_login() -> str:
    # 先注册再登录（未注册教师登录会被校验拦截）
    register_response = client.post(
        "/api/session/teacher/register",
        json={"name": "王老师", "school": "龙头山镇中心小学"},
    )
    assert register_response.status_code == 200
    # 新注册账号为 pending，需管理员审批通过后才能登录
    conn = sqlite3.connect(settings.database_path)
    try:
        conn.execute(
            "UPDATE teachers SET status = 'active' WHERE teacher_id = 'teacher-王老师'"
        )
        conn.commit()
    finally:
        conn.close()
    response = client.post(
        "/api/session/teacher/enter",
        json={"class_code": "LTZ2024", "teacher_name": "王老师"},
    )
    assert response.status_code == 200
    return response.json()["session_token"]


def test_teacher_enter_persists_account_and_lists_class(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_login()

        response = client.get(
            "/api/session/teacher/classes",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["teacher_id"] == "teacher-王老师"
        assert data["name"] == "王老师"
        assert data["school"] == "龙头山镇中心小学"
        assert any(c["class_code"] == "LTZ2024" for c in data["classes"])
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_teacher_classes_rejects_student(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        enter_response = client.post(
            "/api/session/enter",
            json={"class_code": "LTZ2024", "student_name": "王小雅"},
        )
        token = enter_response.json()["session_token"]

        response = client.get(
            "/api/session/teacher/classes",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        data = response.json()
        assert data["code"] == "NOT_TEACHER"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_teacher_switch_class_issues_new_token(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        # 建一个额外班级并让教师关联
        create_response = client.post(
            "/api/classes",
            json={
                "class_name": "二（2）班",
                "school": "水磨镇小学",
                "region_key": "yunnan",
                "grade": "二年级",
                "class_no": "2",
                "students": [{"name": "赵小明", "grade": "二年级", "avatar_seed": 1}],
            },
        )
        assert create_response.status_code == 201
        other_code = create_response.json()["class_code"]

        token = _teacher_login()
        # 让教师关联新班级
        enter_other = client.post(
            "/api/session/teacher/enter",
            json={"class_code": other_code, "teacher_name": "王老师"},
        )
        assert enter_other.status_code == 200

        switch_response = client.post(
            "/api/session/teacher/switch",
            json={"class_code": other_code},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert switch_response.status_code == 200
        data = switch_response.json()
        assert data["profile"]["class_code"] == other_code
        assert data["profile"]["school"] == "水磨镇小学"
        assert data["session_token"].startswith("st_")
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_teacher_switch_unlinked_class_returns_404(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)

    try:
        _seed_db(db_path)
        token = _teacher_login()

        response = client.post(
            "/api/session/teacher/switch",
            json={"class_code": "LTZ2024"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200  # LTZ2024 已关联

        response = client.post(
            "/api/session/teacher/switch",
            json={"class_code": "NO_SUCH"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
    finally:
        Path(db_path).unlink(missing_ok=True)
