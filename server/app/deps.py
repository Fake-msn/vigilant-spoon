"""Shared dependencies (auth etc.)."""

from datetime import datetime, timezone
from typing import Literal, NamedTuple

from fastapi import HTTPException, Request, status

from app.db import get_db_connection
from app.schemas import ErrorEnvelope


def _as_str(value: object) -> str:
    return str(value)


def _extract_token(request: Request) -> str | None:
    """从请求中提取访问令牌。

    魔塔社区创空间平台网关会剥除 `Authorization` header，因此优先从
    自定义 header `X-Auth-Token` 读取；兼容 `Authorization: Bearer <token>`
    作为 fallback（本地直连等不含网关的场景）。
    """
    token = request.headers.get("x-auth-token")
    if token:
        return token.strip()
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return None


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


def get_current_student(request: Request) -> str:
    """Validate token against the sessions table."""
    token = _extract_token(request)
    if token is None:
        raise _unauthorized("TOKEN_INVALID", "登录已失效，请重新进入")

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


def get_current_user(request: Request) -> CurrentUser:
    """Validate token against student or teacher sessions."""
    token = _extract_token(request)
    if token is None:
        raise _unauthorized("TOKEN_INVALID", "登录已失效，请重新进入")

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


def get_current_admin(request: Request) -> str:
    """Validate token against the admin_sessions table."""
    token = _extract_token(request)
    if token is None:
        raise _unauthorized("TOKEN_INVALID", "登录已失效，请重新进入")

    if not token.startswith("ad_"):
        raise _unauthorized("TOKEN_INVALID", "登录已失效，请重新进入")

    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT token, expires_at FROM admin_sessions WHERE token = ?",
            (token,),
        ).fetchone()
        if row is None:
            raise _unauthorized("TOKEN_INVALID", "登录已失效，请重新进入")

        expires_at = datetime.fromisoformat(row["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            raise _unauthorized("TOKEN_EXPIRED", "登录已过期，请重新进入")

        return str(token)
    finally:
        conn.close()
