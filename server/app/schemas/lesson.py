"""Lesson / classroom schemas (R9, R10, R16)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class LessonGenReq(BaseModel):
    """R9：备课生成请求。"""

    topic: str = Field(..., min_length=1, description="课程主题")
    goals: list[str] = Field(..., description="教学目标")
    guidance: str | None = Field(default=None, description="引导策略")


class LessonMaterial(BaseModel):
    """备课素材。"""

    title: str = Field(..., description="素材标题")
    content: str = Field(..., description="素材内容")


class LessonPlan(BaseModel):
    """R9/R10：备课方案。"""

    lesson_id: str = Field(..., description="课程 ID")
    topic: str = Field(..., description="课程主题")
    goals: list[str] = Field(..., description="教学目标")
    guidance_strategy: str = Field(..., description="引导策略")
    materials: list[LessonMaterial] = Field(..., description="素材列表")
    created_at: datetime = Field(..., description="创建时间")


class LessonSummary(BaseModel):
    """R16：课程列表摘要（A4 新增）。"""

    lesson_id: str = Field(..., description="课程 ID")
    topic: str = Field(..., description="课程主题")
    date: str = Field(..., description="日期 MM-DD")
    duration: str | None = Field(default=None, description="时长")
    joined: int = Field(..., ge=0, description="参与人数")
    avg_score: int | None = Field(default=None, description="平均分，演示期可空")
    status: Literal["active", "done"] = Field(..., description="课程状态")
    goal: str = Field(..., description="教学目标")
    traces: list[str] = Field(..., description="课堂痕迹")
