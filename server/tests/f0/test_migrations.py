"""F0 SQLite migration checks."""

import sqlite3
import tempfile
from pathlib import Path

from app.db.migrate import available_migrations, migrate_down, migrate_up


def test_migrations_available_have_down_files() -> None:
    migrations = available_migrations()
    assert migrations, "应至少存在一组迁移"
    for version, up_file, down_file in migrations:
        assert up_file.endswith(".sql")
        assert down_file.endswith("_down.sql")
        assert version in up_file


def test_migrate_up_is_idempotent() -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    conn = sqlite3.connect(db_path)
    try:
        applied1 = migrate_up(conn)
        assert applied1, "首次应应用迁移"
        applied2 = migrate_up(conn)
        assert applied2 == [], "重复迁移应为空"
    finally:
        conn.close()
        Path(db_path).unlink(missing_ok=True)


def test_migrate_down_and_up_again() -> None:
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    conn = sqlite3.connect(db_path)
    try:
        migrate_up(conn)
        rolled = migrate_down(conn)
        assert rolled, "应能回滚"
        applied = migrate_up(conn)
        assert applied, "回滚后应能重新应用"
    finally:
        conn.close()
        Path(db_path).unlink(missing_ok=True)
