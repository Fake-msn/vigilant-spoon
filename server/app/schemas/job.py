"""Async job schemas (R5, R6)."""

from typing import Literal

from pydantic import BaseModel, Field


class JobRef(BaseModel):
    """R5/R8：异步任务引用。"""

    job_id: str = Field(..., description="任务 ID")


class JobError(BaseModel):
    """任务失败时的错误信息。"""

    code: str = Field(..., description="错误码")
    message: str = Field(..., description="错误信息")


class JobStatus(BaseModel):
    """R6：异步任务状态。"""

    job_id: str = Field(..., description="任务 ID")
    status: Literal["pending", "running", "done", "failed"] = Field(..., description="任务状态")
    result_url: str | None = Field(default=None, description="产物 URL，done 时返回")
    error: JobError | None = Field(default=None, description="失败时返回")
