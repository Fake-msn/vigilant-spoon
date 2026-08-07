"""Session / identity endpoints (R2)."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status

from app.constants import REGION_NAMES
from app.db import get_db_connection
from app.schemas import (
    EnterReq,
    EnterResp,
    StudentProfile,
    TeacherEnterReq,
    TeacherEnterResp,
    TeacherProfile,
)
from app.schemas.common import ErrorEnvelope

router = APIRouter(prefix="/session", tags=["session"])

SESSION_TTL_HOURS = 12


def _issue_token() -> str:
    """Generate an opaque session token (st_ + 48 base64url chars)."""
    random_part = secrets.token_urlsafe(36)[:48]
    return f"st_{random_part}"


def _class_not_found(class_code: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="CLASS_NOT_FOUND",
            message="班级码不存在",
            details={"class_code": class_code},
        ).model_dump(),
    )


def _student_not_found(class_code: str, name: str) -> HTTPException:
    conn = get_db_connection()
    try:
        rows = conn.execute(
            "SELECT name FROM students WHERE class_code = ? ORDER BY name",
            (class_code,),
        ).fetchall()
        candidates = [row["name"] for row in rows]
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorEnvelope(
                code="STUDENT_NOT_FOUND",
                message="该班级名单中没有这个名字",
                details={"candidates": candidates},
            ).model_dump(),
        )
    finally:
        conn.close()


@router.post("/enter", response_model=EnterResp)
def enter(req: EnterReq) -> EnterResp:
    conn = get_db_connection()
    try:
        class_row = conn.execute(
            "SELECT class_code, region_key FROM classes WHERE class_code = ?",
            (req.class_code,),
        ).fetchone()
        if class_row is None:
            raise _class_not_found(req.class_code)

        student_row = conn.execute(
            "SELECT student_id, name, student_no, grade, avatar_seed, role, ideal "
            "FROM students WHERE class_code = ? AND name = ?",
            (req.class_code, req.student_name),
        ).fetchone()
        if student_row is None:
            raise _student_not_found(req.class_code, req.student_name)

        region_name = REGION_NAMES.get(class_row["region_key"], class_row["region_key"])
        profile = StudentProfile(
            id=student_row["student_id"],
            name=student_row["name"],
            student_no=student_row["student_no"],
            class_code=req.class_code,
            avatar_seed=student_row["avatar_seed"],
            role=student_row["role"],
            grade=student_row["grade"],
            region_key=class_row["region_key"],
            region_name=region_name,
            ideal=student_row["ideal"],
        )

        token = _issue_token()
        issued_at = datetime.now(timezone.utc)
        expires_at = issued_at + timedelta(hours=SESSION_TTL_HOURS)

        conn.execute(
            "INSERT INTO sessions (token, student_id, class_code, issued_at, expires_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (
                token,
                profile.id,
                req.class_code,
                issued_at.isoformat(),
                expires_at.isoformat(),
            ),
        )
        conn.commit()

        return EnterResp(
            session_token=token,
            profile=profile,
            expires_at=expires_at,
        )
    finally:
        conn.close()


@router.post("/teacher/enter", response_model=TeacherEnterResp)
def teacher_enter(req: TeacherEnterReq) -> TeacherEnterResp:
    """演示期教师登录（无账号密码），签发与课堂控制互通的 token。"""
    conn = get_db_connection()
    try:
        class_row = conn.execute(
            "SELECT class_code, class_name, school, region_key "
            "FROM classes WHERE class_code = ?",
            (req.class_code,),
        ).fetchone()
        if class_row is None:
            raise _class_not_found(req.class_code)

        region_name = REGION_NAMES.get(class_row["region_key"], class_row["region_key"])
        teacher_id = f"teacher-{req.teacher_name}"
        profile = TeacherProfile(
            id=teacher_id,
            name=req.teacher_name,
            role="teacher",
            class_code=req.class_code,
            class_name=class_row["class_name"],
            school=class_row["school"],
            region_key=class_row["region_key"],
            region_name=region_name,
        )

        token = _issue_token()
        issued_at = datetime.now(timezone.utc)
        expires_at = issued_at + timedelta(hours=SESSION_TTL_HOURS)

        conn.execute(
            "INSERT INTO teacher_sessions "
            "(token, teacher_id, name, class_code, issued_at, expires_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                token,
                profile.id,
                profile.name,
                req.class_code,
                issued_at.isoformat(),
                expires_at.isoformat(),
            ),
        )
        conn.commit()

        return TeacherEnterResp(
            session_token=token,
            profile=profile,
            expires_at=expires_at,
        )
    finally:
        conn.close()
