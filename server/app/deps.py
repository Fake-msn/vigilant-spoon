"""Shared dependencies (auth etc.)."""

from datetime import datetime, timezone
from typing import Literal, NamedTuple

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db import get_db_connection
from app.schemas import ErrorEnvelope


def _as_str(value: object) -> str:
    return str(value)

security = HTTPBearer(auto_error=False)


class CurrentUser(NamedTuple):
    user_type: Literal["student", "teacher"]
    user_id: str
    class_code: str


def _unauthorized(code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=ErrorEnvelope(
            code=code,
            message=message,
        ).model_dump(),
    )


def get_current_student(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str:
    """Validate Bearer token against the sessions table."""
    if credentials is None:
        raise _unauthorized("TOKEN_INVALID", "登录已失效，请重新进入")

    token = credentials.credentials
    if not token.startswith("st_"):
        raise _unauthorized("TOKEN_INVALID", "登录已失效，请重新进入")

    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT student_id, expires_at FROM sessions WHERE token = ?",
            (token,),
        ).fetchone()
        if row is None:
            raise _unauthorized("TOKEN_INVALID", "登录已失效，请重新进入")

        expires_at = datetime.fromisoformat(row["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            raise _unauthorized("TOKEN_EXPIRED", "登录已过期，请重新进入")

        return _as_str(row["student_id"])
    finally:
        conn.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser:
    """Validate Bearer token against student or teacher sessions."""
    if credentials is None:
        raise _unauthorized("TOKEN_INVALID", "登录已失效，请重新进入")

    token = credentials.credentials
    if not token.startswith("st_"):
        raise _unauthorized("TOKEN_INVALID", "登录已失效，请重新进入")

    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT student_id, class_code, expires_at FROM sessions WHERE token = ?",
            (token,),
        ).fetchone()
        if row is not None:
            expires_at = datetime.fromisoformat(row["expires_at"])
            if datetime.now(timezone.utc) > expires_at:
                raise _unauthorized("TOKEN_EXPIRED", "登录已过期，请重新进入")
            return CurrentUser(
                user_type="student",
                user_id=_as_str(row["student_id"]),
                class_code=_as_str(row["class_code"]),
            )

        teacher_row = conn.execute(
            "SELECT teacher_id, name, class_code, expires_at FROM teacher_sessions WHERE token = ?",
            (token,),
        ).fetchone()
        if teacher_row is not None:
            expires_at = datetime.fromisoformat(teacher_row["expires_at"])
            if datetime.now(timezone.utc) > expires_at:
                raise _unauthorized("TOKEN_EXPIRED", "登录已过期，请重新进入")
            return CurrentUser(
                user_type="teacher",
                user_id=_as_str(teacher_row["teacher_id"]),
                class_code=_as_str(teacher_row["class_code"]),
            )

        raise _unauthorized("TOKEN_INVALID", "登录已失效，请重新进入")
    finally:
        conn.close()
