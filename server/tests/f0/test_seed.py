"""F0 seed script checks."""

import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

from pytest import MonkeyPatch

from app.config import settings
from app.db.migrate import migrate_up


def test_seed_runs_and_populates_8_students(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)
    base_dir = Path(__file__).resolve().parent.parent.parent

    try:
        result = subprocess.run(
            [sys.executable, "scripts/seed.py", "--fresh", db_path],
            cwd=base_dir,
            capture_output=True,
            text=True,
            check=True,
        )
        assert result.returncode == 0

        conn = sqlite3.connect(db_path)
        try:
            migrate_up(conn)
            cur = conn.execute("SELECT COUNT(*) FROM students")
            (count,) = cur.fetchone()
            assert count == 8
        finally:
            conn.close()
    finally:
        Path(db_path).unlink(missing_ok=True)


def test_seed_is_idempotent(monkeypatch: MonkeyPatch) -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", db_path)
    base_dir = Path(__file__).resolve().parent.parent.parent

    try:
        for _ in range(2):
            subprocess.run(
                [sys.executable, "scripts/seed.py", db_path],
                cwd=base_dir,
                capture_output=True,
                text=True,
                check=True,
            )
        conn = sqlite3.connect(db_path)
        try:
            cur = conn.execute("SELECT COUNT(*) FROM students")
            (count,) = cur.fetchone()
            assert count == 8
        finally:
            conn.close()
    finally:
        Path(db_path).unlink(missing_ok=True)
