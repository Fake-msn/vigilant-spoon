"""班宠积分制度接口测试。"""

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


def _teacher_token() -> str:
    resp = client.post(
        "/api/session/teacher/enter",
        json={"class_code": "LTZ2024", "teacher_name": "李老师"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["session_token"]


def _student_token() -> str:
    resp = client.post(
        "/api/session/enter",
        json={"class_code": "LTZ2024", "student_name": "王小雅"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["session_token"]


def _use_db(monkeypatch: MonkeyPatch) -> str:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    monkeypatch.setattr(settings, "database_path", db_path)
    return db_path


def _read_ledger(db_path: str, student_id: str) -> list[tuple]:
    conn = sqlite3.connect(db_path)
    try:
        return conn.execute(
            "SELECT student_id, rule_id, name, points FROM point_ledger "
            "WHERE student_id = ?",
            (student_id,),
        ).fetchall()
    finally:
        conn.close()


def _read_growth(db_path: str, student_id: str) -> tuple[int, int] | None:
    conn = sqlite3.connect(db_path)
    try:
        row = conn.execute(
            "SELECT points_total, level FROM growth_records WHERE student_id = ?",
            (student_id,),
        ).fetchone()
        if row is None:
            return None
        return (int(row[0]), int(row[1]))
    finally:
        conn.close()


def test_award_points_writes_ledger_and_updates_stats(monkeypatch: MonkeyPatch) -> None:
    db_path = _use_db(monkeypatch)
    try:
        _seed_db(db_path)
        token = _teacher_token()
        headers = {"Authorization": f"Bearer {token}"}
        resp = client.post(
            "/api/classes/LTZ2024/points/award",
            headers=headers,
            json={"student_id": "wxy", "rule_id": "LTZ2024-hand-raise"},
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["points"] == 5
        assert data["points_total"] == 40  # wxy seed points_total=35, +5
        assert data["level"] == 2
        assert data["leveled_up"] is False

        ledger = _read_ledger(db_path, "wxy")
        assert len(ledger) == 1
        assert ledger[0][1] == "LTZ2024-hand-raise"
        assert ledger[0][2] == "主动举手发言"
        assert ledger[0][3] == 5

        growth = _read_growth(db_path, "wxy")
        assert growth is not None
        assert growth[0] == 40  # points_total
        assert growth[1] == 2  # level
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_award_points_requires_teacher(monkeypatch: MonkeyPatch) -> None:
    db_path = _use_db(monkeypatch)
    try:
        _seed_db(db_path)
        token = _student_token()
        resp = client.post(
            "/api/classes/LTZ2024/points/award",
            headers={"Authorization": f"Bearer {token}"},
            json={"student_id": "wxy", "points": 5},
        )
        assert resp.status_code == 403
        assert resp.json()["code"] == "FORBIDDEN"
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_level_up_fires_when_crossing_threshold(monkeypatch: MonkeyPatch) -> None:
    db_path = _use_db(monkeypatch)
    try:
        _seed_db(db_path)
        # 把 wxy 积分调到 28（level 1），再加 5 分应跨过 30 阈值升级
        conn = sqlite3.connect(db_path)
        try:
            conn.execute(
                "UPDATE growth_records SET points_total = 28, level = 1 WHERE student_id = 'wxy'"
            )
            conn.commit()
        finally:
            conn.close()

        token = _teacher_token()
        resp = client.post(
            "/api/classes/LTZ2024/points/award",
            headers={"Authorization": f"Bearer {token}"},
            json={"student_id": "wxy", "points": 5},
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["points_total"] == 33
        assert data["level"] == 2
        assert data["leveled_up"] is True
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_rule_update_and_read(monkeypatch: MonkeyPatch) -> None:
    db_path = _use_db(monkeypatch)
    try:
        _seed_db(db_path)
        token = _teacher_token()
        headers = {"Authorization": f"Bearer {token}"}
        new_rules = [
            {
                "rule_id": "LTZ2024-hw",
                "name": "作业五星",
                "points": 20,
                "category": "homework",
                "enabled": True,
            },
            {
                "rule_id": "LTZ2024-lecture",
                "name": "认真听讲",
                "points": 3,
                "category": "class",
                "enabled": False,
            },
        ]
        resp = client.put(
            "/api/classes/LTZ2024/points/rules",
            headers=headers,
            json={"rules": new_rules},
        )
        assert resp.status_code == 200, resp.text
        rules = resp.json()
        assert len(rules) == 2
        assert rules[0]["rule_id"] == "LTZ2024-hw"
        assert rules[0]["points"] == 20
        assert rules[1]["enabled"] is False

        resp = client.get(
            "/api/classes/LTZ2024/points/rules", headers=headers
        )
        assert resp.status_code == 200
        assert resp.json() == rules
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_group_config_and_leaderboard(monkeypatch: MonkeyPatch) -> None:
    db_path = _use_db(monkeypatch)
    try:
        _seed_db(db_path)
        token = _teacher_token()
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.put(
            "/api/classes/LTZ2024/groups",
            headers=headers,
            json={
                "groups": [
                    {"group_name": "苹果组", "color": "red"},
                    {"group_name": "香蕉组", "color": "yellow"},
                ],
                "assignments": {"wxy": "LTZ2024-g01"},
            },
        )
        assert resp.status_code == 200, resp.text
        groups = resp.json()
        assert len(groups) == 2
        assert groups[0]["group_id"] == "LTZ2024-g01"
        assert groups[0]["members"] == ["wxy"]
        assert groups[1]["members"] == []

        # 给 wxy 加 5 分（wxy 属于苹果组，seed points_total=35 -> 40）
        resp = client.post(
            "/api/classes/LTZ2024/points/award",
            headers=headers,
            json={"student_id": "wxy", "rule_id": "LTZ2024-hand-raise"},
        )
        assert resp.status_code == 200, resp.text

        resp = client.get(
            "/api/classes/LTZ2024/leaderboard", headers=headers
        )
        assert resp.status_code == 200, resp.text
        items = resp.json()["items"]
        assert items[0]["group_id"] == "LTZ2024-g01"
        assert items[0]["total_points"] == 40
        assert items[0]["member_count"] == 1
        assert items[1]["group_id"] == "LTZ2024-g02"
        assert items[1]["total_points"] == 0
        assert items[1]["member_count"] == 0
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_leaderboard_teacher_only(monkeypatch: MonkeyPatch) -> None:
    db_path = _use_db(monkeypatch)
    try:
        _seed_db(db_path)
        token = _student_token()
        resp = client.get(
            "/api/classes/LTZ2024/leaderboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403
        assert resp.json()["code"] == "FORBIDDEN"
    finally:
        Path(db_path).unlink(missing_ok=True)
