"""Classroom control schemas (R11, R12, R13)."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ControlReq(BaseModel):
    """R12：课堂控制指令（A9 新增 client_cmd_id 去重）。"""

    action: Literal[
        "pause", "resume", "next_student", "switch_content", "select_student"
    ] = Field(..., description="控制动作")
    payload: dict[str, Any] | None = Field(default=None, description="动作附加数据")
    client_cmd_id: str = Field(..., description="客户端命令 ID，用于去重")


class ClassroomStatus(BaseModel):
    """R11/R12/R13：课堂状态。"""

    session_id: str = Field(..., description="课堂会话 ID")
    state: Literal["idle", "active", "paused"] = Field(..., description="课堂状态")
    current_student: str | None = Field(default=None, description="当前轮到的学生")
    current_slot: str | None = Field(default=None, description="当前 slot/内容")
    turn_count: int = Field(..., ge=0, description="轮次计数")
    updated_at: datetime = Field(..., description="更新时间")
