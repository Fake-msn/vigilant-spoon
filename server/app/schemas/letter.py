"""Letter schemas (R7, R8)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Letter(BaseModel):
    """R7：学生来信（A6 新增 is_read）。"""

    letter_id: str = Field(..., description="信件 ID")
    student_id: str = Field(..., description="学生 ID")
    title: str = Field(..., description="信件标题")
    body: str = Field(..., description="信件正文")
    generated_at: datetime = Field(..., description="生成时间")
    source: Literal["template", "llm"] = Field(..., description="生成来源")
    is_read: bool = Field(..., description="是否已读")
