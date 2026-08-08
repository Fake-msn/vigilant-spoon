"""Letter endpoints (R7, R8)."""

from __future__ import annotations

import sqlite3
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.db import get_db_connection
from app.deps import CurrentUser, get_current_user
from app.jobs.letter_job import run_letter_job
from app.schemas import JobRef, Letter
from app.schemas.common import ErrorEnvelope

router = APIRouter(prefix="/students", tags=["letters"])


def _student_not_found(student_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="STUDENT_NOT_FOUND",
            message="学生不存在",
            details={"student_id": student_id},
        ).model_dump(),
    )


def _assert_access(conn: sqlite3.Connection, user: CurrentUser, student_id: str) -> None:
    """学生只能看自己的信；教师可看本班所有学生。"""
    if user.user_type == "student" and user.user_id != student_id:
        raise _student_not_found(student_id)

    row = conn.execute(
        "SELECT class_code FROM students WHERE student_id = ?", (student_id,)
    ).fetchone()
    if row is None:
        raise _student_not_found(student_id)
    if row["class_code"] != user.class_code:
        raise _student_not_found(student_id)


def _build_letter(row: sqlite3.Row) -> Letter:
    return Letter(
        letter_id=row["letter_id"],
        student_id=row["student_id"],
        title=row["title"],
        body=row["body"],
        generated_at=datetime.fromisoformat(row["generated_at"]),
        source=row["source"],
        is_read=bool(row["is_read"]),
    )


@router.get("/{student_id}/letters", response_model=list[Letter])
def list_letters(
    student_id: str,
    cursor: str = "",
    limit: int = 20,
    user: CurrentUser = Depends(get_current_user),
) -> list[Letter]:
    """R7：按 generated_at 倒序分页查询学生来信。

    cursor 为上一页最后一条的 generated_at ISO 字符串。
    """
    conn = get_db_connection()
    try:
        _assert_access(conn, user, student_id)

        params: list[Any] = [student_id]
        where_clause = "WHERE student_id = ?"
        if cursor:
            where_clause += " AND generated_at < ?"
            params.append(cursor)

        rows = conn.execute(
            f"""
            SELECT letter_id, student_id, title, body, generated_at, source, is_read
            FROM letters
            {where_clause}
            ORDER BY generated_at DESC
            LIMIT ?
            """,
            (*params, limit + 1),
        ).fetchall()

        return [_build_letter(row) for row in rows[:limit]]
    finally:
        conn.close()


@router.post("/{student_id}/letters/generate", response_model=JobRef)
def generate_letters(
    student_id: str,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    user: CurrentUser = Depends(get_current_user),
) -> JobRef:
    """R8：手动触发为学生生成一封信，支持幂等键。"""
    conn = get_db_connection()
    try:
        _assert_access(conn, user, student_id)
    finally:
        conn.close()

    job_id = run_letter_job(student_id, idempotency_key=idempotency_key)
    return JobRef(job_id=job_id)
