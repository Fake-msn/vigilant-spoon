"""Session / identity endpoints (R2)."""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import REGION_NAMES
from app.db import get_db_connection
from app.deps import CurrentUser, get_current_user
from app.schemas import (
    EnterReq,
    EnterResp,
    StudentProfile,
    TeacherAccount,
    TeacherAccountUpdateReq,
    TeacherClassesResp,
    TeacherClassView,
    TeacherEnterReq,
    TeacherEnterResp,
    TeacherLoginReq,
    TeacherPasswordUpdateReq,
    TeacherProfile,
    TeacherRegisterReq,
    TeacherSwitchReq,
)
from app.schemas.common import ErrorEnvelope

router = APIRouter(prefix="/session", tags=["session"])

SESSION_TTL_HOURS = 12

_PBKDF2_ITERATIONS = 100_000


def _hash_password(password: str) -> str:
    """Return a salted PBKDF2 hash string: pbkdf2_sha256$it$salt$hash."""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERATIONS
    )
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${salt}${digest.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        algo, it, salt, expected = stored.split("$", 3)
    except ValueError:
        return False
    if algo != "pbkdf2_sha256":
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), int(it)
    )
    return hmac.compare_digest(digest.hex(), expected)


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


def _teacher_not_registered(name: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="TEACHER_NOT_REGISTERED",
            message="该教师尚未注册，请先完成账号注册",
            details={"teacher_name": name},
        ).model_dump(),
    )


def _wrong_password() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=ErrorEnvelope(
            code="WRONG_PASSWORD",
            message="密码不正确",
        ).model_dump(),
    )


def _teacher_pending_review() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=ErrorEnvelope(
            code="TEACHER_PENDING_REVIEW",
            message="该教师账号正在等待管理员审核，暂无法登录",
        ).model_dump(),
    )


def _teacher_rejected(reason: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=ErrorEnvelope(
            code="TEACHER_REJECTED",
            message=f"该教师账号已被驳回：{reason or '未说明原因'}",
        ).model_dump(),
    )


def _teacher_no_classes(name: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="TEACHER_NO_CLASSES",
            message="该教师还没有任教班级，请先创建班级或让管理员添加班级关联",
            details={"teacher_name": name},
        ).model_dump(),
    )


AccountStatus = Literal["pending", "active", "rejected"]


def _account_status(value: object) -> AccountStatus:
    """Coerce a stored status cell to a valid account status."""
    status = _as_str(value)
    if status == "pending":
        return "pending"
    if status == "rejected":
        return "rejected"
    return "active"


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
    """教师登录：校验账号已注册（可选密码），建立账号-班级关联。"""
    conn = get_db_connection()
    try:
        class_row = conn.execute(
            "SELECT class_code, class_name, school, region_key "
            "FROM classes WHERE class_code = ?",
            (req.class_code,),
        ).fetchone()
        if class_row is None:
            raise _class_not_found(req.class_code)

        teacher_id = f"teacher-{req.teacher_name}"
        teacher_row = conn.execute(
            "SELECT name, school, password_hash, status, reject_reason "
            "FROM teachers WHERE teacher_id = ?",
            (teacher_id,),
        ).fetchone()
        if teacher_row is None:
            raise _teacher_not_registered(req.teacher_name)

        account_status = _as_str(teacher_row["status"]) or "active"
        if account_status == "pending":
            raise _teacher_pending_review()
        if account_status == "rejected":
            raise _teacher_rejected(_as_str(teacher_row["reject_reason"]))

        stored_hash = _as_str(teacher_row["password_hash"])
        if stored_hash:
            if not req.password or not _verify_password(req.password, stored_hash):
                raise _wrong_password()

        region_name = REGION_NAMES.get(class_row["region_key"], class_row["region_key"])
        profile = TeacherProfile(
            id=teacher_id,
            name=_as_str(teacher_row["name"]) or req.teacher_name,
            role="teacher",
            class_code=req.class_code,
            class_name=class_row["class_name"],
            school=_as_str(teacher_row["school"]) or class_row["school"],
            region_key=class_row["region_key"],
            region_name=region_name,
        )

        # 关联当前班级（账号已存在，仅补关联）
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


@router.post("/teacher/login", response_model=TeacherEnterResp)
def teacher_login(req: TeacherLoginReq) -> TeacherEnterResp:
    """教师登录（不指定班级）：校验账号已注册（可选密码），默认进入任教时间最新的班级。"""
    conn = get_db_connection()
    try:
        teacher_id = f"teacher-{req.teacher_name}"
        teacher_row = conn.execute(
            "SELECT name, school, password_hash, status, reject_reason "
            "FROM teachers WHERE teacher_id = ?",
            (teacher_id,),
        ).fetchone()
        if teacher_row is None:
            raise _teacher_not_registered(req.teacher_name)

        account_status = _as_str(teacher_row["status"]) or "active"
        if account_status == "pending":
            raise _teacher_pending_review()
        if account_status == "rejected":
            raise _teacher_rejected(_as_str(teacher_row["reject_reason"]))

        stored_hash = _as_str(teacher_row["password_hash"])
        if stored_hash:
            if not req.password or not _verify_password(req.password, stored_hash):
                raise _wrong_password()

        # 取教师任教的班级（按最近分配时间优先）
        class_rows = conn.execute(
            "SELECT cl.class_code, cl.class_name, cl.school, cl.region_key "
            "FROM teacher_classes tc "
            "JOIN classes cl ON cl.class_code = tc.class_code "
            "WHERE tc.teacher_id = ? ORDER BY tc.assigned_at DESC LIMIT 1",
            (teacher_id,),
        ).fetchall()
        if not class_rows:
            raise _teacher_no_classes(req.teacher_name)
        class_row = class_rows[0]

        region_name = REGION_NAMES.get(class_row["region_key"], class_row["region_key"])
        profile = TeacherProfile(
            id=teacher_id,
            name=_as_str(teacher_row["name"]) or req.teacher_name,
            role="teacher",
            class_code=class_row["class_code"],
            class_name=class_row["class_name"],
            school=_as_str(teacher_row["school"]) or class_row["school"],
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
                profile.class_code,
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


@router.post("/teacher/register", response_model=TeacherAccount)
def teacher_register(req: TeacherRegisterReq) -> TeacherAccount:
    """教师注册：创建账号（必填姓名，个人信息与密码可选）。"""
    name = req.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=ErrorEnvelope(
                code="VALIDATION_ERROR", message="请填写教师姓名"
            ).model_dump(),
        )
    teacher_id = f"teacher-{name}"

    conn = get_db_connection()
    try:
        existing = conn.execute(
            "SELECT teacher_id FROM teachers WHERE teacher_id = ?", (teacher_id,)
        ).fetchone()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=ErrorEnvelope(
                    code="TEACHER_EXISTS",
                    message="该教师姓名已被注册",
                    details={"teacher_name": name},
                ).model_dump(),
            )

        password_hash = _hash_password(req.password) if req.password else None
        conn.execute(
            "INSERT INTO teachers "
            "(teacher_id, name, school, phone, subject, title, password_hash, status) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')",
            (
                teacher_id,
                name,
                req.school.strip(),
                req.phone.strip(),
                req.subject.strip(),
                req.title.strip(),
                password_hash,
            ),
        )
        conn.commit()

        return TeacherAccount(
            teacher_id=teacher_id,
            name=name,
            school=req.school,
            phone=req.phone,
            subject=req.subject,
            title=req.title,
            has_password=bool(password_hash),
            status="pending",
        )
    finally:
        conn.close()


@router.get("/teacher/account", response_model=TeacherAccount)
def teacher_account(user: CurrentUser = Depends(get_current_user)) -> TeacherAccount:
    """获取当前教师账号信息。"""
    if user.user_type != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorEnvelope(
                code="NOT_TEACHER", message="仅教师账号可访问"
            ).model_dump(),
        )

    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT teacher_id, name, school, phone, subject, title, password_hash, status "
            "FROM teachers WHERE teacher_id = ?",
            (user.user_id,),
        ).fetchone()
        if row is None:
            raise _teacher_not_registered(user.user_id.removeprefix("teacher-"))

        return TeacherAccount(
            teacher_id=_as_str(row["teacher_id"]),
            name=_as_str(row["name"]),
            school=_as_str(row["school"]),
            phone=_as_str(row["phone"]),
            subject=_as_str(row["subject"]),
            title=_as_str(row["title"]),
            has_password=bool(_as_str(row["password_hash"])),
            status=_account_status(row["status"]),
        )
    finally:
        conn.close()


@router.put("/teacher/account", response_model=TeacherAccount)
def teacher_account_update(
    req: TeacherAccountUpdateReq, user: CurrentUser = Depends(get_current_user)
) -> TeacherAccount:
    """更新当前教师个人信息（均可选）。"""
    if user.user_type != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorEnvelope(
                code="NOT_TEACHER", message="仅教师账号可访问"
            ).model_dump(),
        )

    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT school, phone, subject, title, password_hash, status "
            "FROM teachers WHERE teacher_id = ?",
            (user.user_id,),
        ).fetchone()
        if row is None:
            raise _teacher_not_registered(user.user_id.removeprefix("teacher-"))

        school = _as_str(row["school"]) if req.school is None else req.school
        phone = _as_str(row["phone"]) if req.phone is None else req.phone
        subject = _as_str(row["subject"]) if req.subject is None else req.subject
        title = _as_str(row["title"]) if req.title is None else req.title

        conn.execute(
            "UPDATE teachers SET school = ?, phone = ?, subject = ?, title = ? "
            "WHERE teacher_id = ?",
            (school, phone, subject, title, user.user_id),
        )
        conn.commit()

        return TeacherAccount(
            teacher_id=user.user_id,
            name=user.user_id.removeprefix("teacher-"),
            school=school,
            phone=phone,
            subject=subject,
            title=title,
            has_password=bool(_as_str(row["password_hash"])),
            status=_account_status(row["status"]),
        )
    finally:
        conn.close()


@router.put("/teacher/password", response_model=TeacherAccount)
def teacher_password_update(
    req: TeacherPasswordUpdateReq, user: CurrentUser = Depends(get_current_user)
) -> TeacherAccount:
    """设置 / 修改教师密码（可选）。"""
    if user.user_type != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorEnvelope(
                code="NOT_TEACHER", message="仅教师账号可访问"
            ).model_dump(),
        )

    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT school, phone, subject, title, password_hash, status "
            "FROM teachers WHERE teacher_id = ?",
            (user.user_id,),
        ).fetchone()
        if row is None:
            raise _teacher_not_registered(user.user_id.removeprefix("teacher-"))

        stored_hash = _as_str(row["password_hash"])
        if stored_hash:
            if not req.old_password or not _verify_password(req.old_password, stored_hash):
                raise _wrong_password()

        new_hash = _hash_password(req.new_password)
        conn.execute(
            "UPDATE teachers SET password_hash = ? WHERE teacher_id = ?",
            (new_hash, user.user_id),
        )
        conn.commit()

        return TeacherAccount(
            teacher_id=user.user_id,
            name=user.user_id.removeprefix("teacher-"),
            school=_as_str(row["school"]),
            phone=_as_str(row["phone"]),
            subject=_as_str(row["subject"]),
            title=_as_str(row["title"]),
            has_password=True,
            status=_account_status(row["status"]),
        )
    finally:
        conn.close()
