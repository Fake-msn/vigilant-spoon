"""Async job endpoints (R6)."""

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, status

from app.db import get_db_connection
from app.deps import CurrentUser, get_current_user
from app.schemas import JobError, JobStatus
from app.schemas.common import ErrorEnvelope

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _job_not_found(job_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="JOB_NOT_FOUND",
            message="任务不存在",
            details={"job_id": job_id},
        ).model_dump(),
    )


def _assert_job_access(conn: sqlite3.Connection, user: CurrentUser, job_id: str) -> None:
    """学生只能查自己的任务；教师可查本班学生的任务。"""
    row = conn.execute(
        "SELECT student_id FROM jobs WHERE job_id = ?", (job_id,)
    ).fetchone()
    if row is None:
        raise _job_not_found(job_id)

    student_id = row["student_id"]
    if user.user_type == "student" and user.user_id != student_id:
        raise _job_not_found(job_id)

    student_row = conn.execute(
        "SELECT class_code FROM students WHERE student_id = ?", (student_id,)
    ).fetchone()
    if student_row is None or student_row["class_code"] != user.class_code:
        raise _job_not_found(job_id)


@router.get("/{job_id}", response_model=JobStatus)
def get_job_status(
    job_id: str, user: CurrentUser = Depends(get_current_user)
) -> JobStatus:
    conn = get_db_connection()
    try:
        _assert_job_access(conn, user, job_id)
        row = conn.execute(
            "SELECT status, result_url, error_code, error_message FROM jobs WHERE job_id = ?",
            (job_id,),
        ).fetchone()
        if row is None:
            raise _job_not_found(job_id)

        error = None
        if row["error_code"]:
            error = JobError(code=row["error_code"], message=row["error_message"] or "")

        return JobStatus(
            job_id=job_id,
            status=row["status"],
            result_url=row["result_url"],
            error=error,
        )
    finally:
        conn.close()
