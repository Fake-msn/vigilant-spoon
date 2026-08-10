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
        # 逐条执行：允许 ALTER TABLE ADD COLUMN 在列已存在时静默跳过，
        # 保证迁移在不同初始 schema 下（如 seed.py 的 CREATE_SQL 已含某些列）幂等。
        for stmt in _split_statements(sql):
            stmt = stmt.strip()
            if not stmt:
                continue
            try:
                conn.execute(stmt)
            except sqlite3.OperationalError as e:
                msg = str(e).lower()
                if "duplicate column name" in msg:
                    logger.warning("  column already exists, skipping: %s", stmt[:80])
                    continue
                raise
        conn.execute(
            "INSERT INTO schema_migrations (version) VALUES (?)",
            (version,),
        )
        conn.commit()
        applied_versions.append(version)
    return applied_versions


def _split_statements(sql: str) -> list[str]:
    """按分号拆分 SQL 语句，过滤注释和空语句。"""
    stmts: list[str] = []
    # 去除 SQL 注释（-- 开头的行内注释）
    cleaned_lines: list[str] = []
    for line in sql.splitlines():
        # 去掉行内注释（简单处理：-- 后的内容，但不处理字符串内的 --）
        comment_pos = line.find("--")
        if comment_pos >= 0:
            line = line[:comment_pos]
        cleaned_lines.append(line)
    cleaned = "\n".join(cleaned_lines)
    for part in cleaned.split(";"):
        part = part.strip()
        if part:
            stmts.append(part)
    return stmts


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
