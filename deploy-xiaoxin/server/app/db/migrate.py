"""Lightweight SQLite migration runner with down migrations."""

from __future__ import annotations

import logging
import sqlite3
from pathlib import Path

from app.config import settings

logger = logging.getLogger("db.migrate")

MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"

CREATE_MIGRATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def get_applied_versions(conn: sqlite3.Connection) -> set[str]:
    conn.execute(CREATE_MIGRATIONS_TABLE)
    cur = conn.execute("SELECT version FROM schema_migrations")
    return {row[0] for row in cur.fetchall()}


def read_sql(name: str) -> str:
    path = MIGRATIONS_DIR / name
    return path.read_text(encoding="utf-8")


def available_migrations() -> list[tuple[str, str, str]]:
    """Return list of (version, up_filename, down_filename)."""
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    ups = [f for f in files if not f.name.endswith("_down.sql")]
    migrations: list[tuple[str, str, str]] = []
    for up in ups:
        version = up.stem
        down = up.with_name(f"{version}_down.sql")
        if not down.exists():
            raise FileNotFoundError(f"缺少 down 迁移文件: {down}")
        migrations.append((version, up.name, down.name))
    return migrations


def migrate_up(conn: sqlite3.Connection, target: str | None = None) -> list[str]:
    """Apply all pending up migrations. Return applied versions."""
    applied = get_applied_versions(conn)
    applied_versions: list[str] = []
    for version, up_file, _down_file in available_migrations():
        if target is not None and version > target:
            break
        if version in applied:
            continue
        logger.info("Applying migration %s", version)
        sql = read_sql(up_file)
        conn.executescript(sql)
        conn.execute(
            "INSERT INTO schema_migrations (version) VALUES (?)",
            (version,),
        )
        conn.commit()
        applied_versions.append(version)
    return applied_versions


def migrate_down(conn: sqlite3.Connection, target: str | None = None) -> list[str]:
    """Rollback migrations until target (inclusive). Return rolled back versions."""
    applied = sorted(get_applied_versions(conn), reverse=True)
    rolled: list[str] = []
    migrations = {v: (u, d) for v, u, d in available_migrations()}
    for version in applied:
        if target is not None and version <= target:
            break
        up_file, down_file = migrations[version]
        logger.info("Rolling back migration %s", version)
        sql = read_sql(down_file)
        conn.executescript(sql)
        conn.execute("DELETE FROM schema_migrations WHERE version = ?", (version,))
        conn.commit()
        rolled.append(version)
    return rolled


def ensure_migrated() -> None:
    with sqlite3.connect(settings.database_path) as conn:
        migrate_up(conn)
