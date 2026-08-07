"""Session / identity endpoints (R2)."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import REGION_NAMES
from app.db import get_db_connection
from app.deps import CurrentUser, get_current_user
from app.schemas import (
    EnterReq,
    EnterResp,
    StudentProfile,
    TeacherClassesResp,
    TeacherClassView,
    TeacherEnterReq,
    TeacherEnterResp,
    TeacherProfile,
    TeacherSwitchReq,
)
from app.schemas.common import ErrorEnvelope

router = APIRouter(prefix="/session", tags=["session"])

SESSION_TTL_HOURS = 12


def _issue_token() -> str:
    """Generate an opaque session token (st_ + 48 base64url chars)."""
    random_part = secrets.token_urlsafe(36)[:48]
    return f"st_{random_part}"


def _as_str(value: object) -> str:
    """Safely coerce a sqlite3 Row cell to str (handles bytes/null)."""
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return str(value)


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
    """教师登录（无密码）：录入姓名后进入班级，并建立账号-班级关联。"""
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

        # 落库教师档案（upsert）并关联当前班级
        conn.execute(
            "INSERT INTO teachers (teacher_id, name, school) VALUES (?, ?, ?) "
            "ON CONFLICT(teacher_id) DO UPDATE SET "
            "name = excluded.name, "
            "school = CASE WHEN excluded.school != '' "
            "THEN excluded.school ELSE teachers.school END",
            (teacher_id, req.teacher_name, class_row["school"]),
        )
        conn.execute(
            "INSERT OR IGNORE INTO teacher_classes (teacher_id, class_code) VALUES (?, ?)",
            (teacher_id, req.class_code),
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


@router.get("/teacher/classes", response_model=TeacherClassesResp)
def teacher_classes(user: CurrentUser = Depends(get_current_user)) -> TeacherClassesResp:
    """教师账号概览：返回教师本人信息与任教班级列表。"""
    if user.user_type != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorEnvelope(
                code="NOT_TEACHER",
                message="仅教师账号可访问",
            ).model_dump(),
        )

    conn = get_db_connection()
    try:
        teacher = conn.execute(
            "SELECT teacher_id, name, school FROM teachers WHERE teacher_id = ?",
            (user.user_id,),
        ).fetchone()
        if teacher is None:
            teacher_id = user.user_id
            teacher_name = user.user_id.removeprefix("teacher-")
            teacher_school = ""
        else:
            teacher_id = _as_str(teacher["teacher_id"])
            teacher_name = _as_str(teacher["name"])
            teacher_school = _as_str(teacher["school"])

        rows = conn.execute(
            "SELECT cl.class_code, cl.class_name, cl.school, cl.grade, cl.class_no "
            "FROM teacher_classes tc "
            "JOIN classes cl ON cl.class_code = tc.class_code "
            "WHERE tc.teacher_id = ? ORDER BY tc.assigned_at DESC",
            (user.user_id,),
        ).fetchall()

        classes = [
            TeacherClassView(
                class_code=_as_str(r["class_code"]),
                class_name=_as_str(r["class_name"]),
                school=_as_str(r["school"]),
                grade=_as_str(r["grade"]),
                class_no=_as_str(r["class_no"]),
            )
            for r in rows
        ]

        return TeacherClassesResp(
            teacher_id=teacher_id,
            name=teacher_name,
            school=teacher_school,
            classes=classes,
        )
    finally:
        conn.close()


@router.post("/teacher/switch", response_model=TeacherEnterResp)
def teacher_switch(
    req: TeacherSwitchReq, user: CurrentUser = Depends(get_current_user)
) -> TeacherEnterResp:
    """教师在任教班级间切换：为目标班级签发新的教师会话 token。"""
    if user.user_type != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorEnvelope(
                code="NOT_TEACHER",
                message="仅教师账号可访问",
            ).model_dump(),
        )

    conn = get_db_connection()
    try:
        linked = conn.execute(
            "SELECT 1 FROM teacher_classes WHERE teacher_id = ? AND class_code = ?",
            (user.user_id, req.class_code),
        ).fetchone()
        if linked is None:
            raise _class_not_found(req.class_code)

        class_row = conn.execute(
            "SELECT class_code, class_name, school, region_key "
            "FROM classes WHERE class_code = ?",
            (req.class_code,),
        ).fetchone()
        if class_row is None:
            raise _class_not_found(req.class_code)

        teacher = conn.execute(
            "SELECT name FROM teachers WHERE teacher_id = ?", (user.user_id,)
        ).fetchone()
        teacher_name = (
            _as_str(teacher["name"]) if teacher else user.user_id.removeprefix("teacher-")
        )

        region_name = REGION_NAMES.get(class_row["region_key"], class_row["region_key"])
        profile = TeacherProfile(
            id=user.user_id,
            name=teacher_name,
            role="teacher",
            class_code=req.class_code,
            class_name=_as_str(class_row["class_name"]),
            school=_as_str(class_row["school"]),
            region_key=_as_str(class_row["region_key"]),
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
