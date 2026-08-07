"""管理员后台：模型服务配置管理（方案 5.3）。

- `POST /admin/login`：管理员密码登录，签发 `ad_` token。
- `GET /admin/config`：读取当前生效配置（env 默认 + DB 覆盖）。
- `PUT /admin/config`：部分更新模型配置。
"""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.db import get_db_connection
from app.deps import get_current_admin
from app.schemas import (
    AdminLoginReq,
    AdminLoginResp,
    ServiceConfig,
    ServiceConfigUpdate,
)
from app.schemas.common import ErrorEnvelope
from app.services import runtime_config

router = APIRouter(prefix="/admin", tags=["admin"])

SESSION_TTL_HOURS = 12


def _issue_token() -> str:
    return f"ad_{secrets.token_urlsafe(36)[:48]}"


def _unauthorized(code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=ErrorEnvelope(code=code, message=message).model_dump(),
    )


@router.post("/login", response_model=AdminLoginResp)
def admin_login(req: AdminLoginReq) -> AdminLoginResp:
    """管理员密码登录。"""
    if not settings.admin_password or req.password != settings.admin_password:
        raise _unauthorized("INVALID_PASSWORD", "管理员密码错误")

    token = _issue_token()
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(hours=SESSION_TTL_HOURS)

    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO admin_sessions (token, issued_at, expires_at) VALUES (?, ?, ?)",
            (token, issued_at.isoformat(), expires_at.isoformat()),
        )
        conn.commit()
    finally:
        conn.close()

    return AdminLoginResp(session_token=token, expires_at=expires_at.isoformat())


@router.get("/config", response_model=ServiceConfig)
def get_config(_admin: str = Depends(get_current_admin)) -> ServiceConfig:
    """读取当前生效的模型服务配置。"""
    return ServiceConfig(**runtime_config.get_config())


@router.put("/config", response_model=ServiceConfig)
def update_config(
    update: ServiceConfigUpdate,
    _admin: str = Depends(get_current_admin),
) -> ServiceConfig:
    """部分更新模型服务配置，未提供的字段保持不变。"""
    values = {k: v for k, v in update.model_dump().items() if v is not None}
    return ServiceConfig(**runtime_config.set_config(values))
