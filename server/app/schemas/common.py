"""Common envelope schemas."""

from typing import Any

from pydantic import BaseModel, Field


class ErrorEnvelope(BaseModel):
    """统一错误 envelope（v2.1 契约 §2）。"""

    code: str = Field(..., examples=["STUDENT_NOT_FOUND"], description="面向程序的错误码")
    message: str = Field(
        ...,
        examples=["该班级名单中没有这个名字"],
        description="面向用户的可读信息",
    )
    details: dict[str, Any] | None = Field(
        default=None,
        examples=[{"candidates": ["王小雅", "吴小雪"]}],
        description="扩展字段",
    )


class HealthCheck(BaseModel):
    status: str = "ok"
