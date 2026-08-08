"""Database utilities."""

import sqlite3

from app.config import settings


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    return conn
