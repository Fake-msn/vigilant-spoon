"""Growth / pet / academic schemas (R3, R4, R14, R15, R17)."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class Commitment(BaseModel):
    """承诺（确定性状态机，绝不 RAG）。"""

    id: str = Field(..., description="承诺 ID")
    text: str = Field(..., description="承诺内容")
    created_at: datetime = Field(..., description="创建时间")
    status: Literal["active", "fulfilled", "expired"] = Field(..., description="承诺状态")


class CommitmentInput(BaseModel):
    """教师端编辑承诺时使用的入力结构（创建时间可缺省，服务器自动补齐）。"""

    id: str = Field(..., description="承诺 ID，前端生成的唯一字符串")
    text: str = Field(..., min_length=1, description="承诺内容")
    created_at: datetime | None = Field(default=None, description="创建时间（空=当下）")
    status: Literal["active", "fulfilled", "expired"] = Field(default="active", description="承诺状态")


class CommitmentsPatch(BaseModel):
    """教师端全量替换学生承诺列表的请求体。"""

    commitments: list[CommitmentInput] = Field(..., description="完整承诺列表（覆盖写入）")


class PetState(BaseModel):
    """宠物状态（v2.1 三态，A1）。"""

    species: str = Field(..., description="职业方向决定的外观族系")
    stage: int = Field(..., ge=0, description="阶段 0..N")
    state: Literal["daily", "gray", "cheer"] = Field(..., description="三态：日常/关注/鼓舞")
    growth_value: int = Field(..., ge=0, description="成长值")
    last_growth_at: datetime = Field(..., description="上次成长时间")
    cheer_until: datetime | None = Field(default=None, description="鼓舞态有效期截止")
    needs_care: bool = Field(..., description="是否需要教师关注（gray 态置位）")
    portrait_url: str | None = Field(default=None, description="宠物画像 URL")
    points_total: int = Field(default=0, description="累计积分")
    level: int = Field(default=1, ge=1, description="宠物等级")
    hunger: int = Field(default=50, ge=0, le=100, description="饥饿度")
    mood: int = Field(default=60, ge=0, le=100, description="心情")
    updated_at: datetime = Field(..., description="更新时间")


class GrowthView(BaseModel):
    """R3：成长档案视图（任何视角不含 scores）。"""

    ideal: str | None = Field(..., description="理想职业/志向")
    commitments: list[Commitment] = Field(..., description="承诺列表")
    last_gist: str | None = Field(..., description="上次一句话摘要")
    growth_value: int = Field(..., ge=0, description="成长值")
    stage: str = Field(..., description="阶段字符串")
    pet: PetState = Field(..., description="宠物状态")
    actions: list[dict[str, Any]] | None = Field(
        default=None, description="view=full 追加：行动记录"
    )
    history: list[dict[str, Any]] | None = Field(
        default=None, description="view=full 追加：谈心记录"
    )


class EvidenceItem(BaseModel):
    """评分证据链（可申诉）。"""

    rubric_id: str = Field(..., description="维度 ID")
    quote_span: tuple[int, int] = Field(..., description="原文 span [start, end]")
    source: Literal["transcript", "profile"] = Field(..., description="证据来源")
    note: str = Field(..., description="备注")


class ScoreCard(BaseModel):
    """结算链产物；不进 R3/R17。"""

    session_id: str = Field(..., description="会话 ID")
    student_id: str = Field(..., description="学生 ID")
    dimensions: dict[str, int] = Field(..., description="rubric 各维度分")
    total: int = Field(..., description="总分")
    evidence: list[EvidenceItem] = Field(..., description="证据链")
    created_at: datetime = Field(..., description="创建时间")


class SubjectScore(BaseModel):
    """单科成绩（含趋势）。"""

    subject: str = Field(..., description="科目")
    score: int = Field(..., ge=0, le=100, description="分数 0-100")
    trend: Literal["up", "down", "flat"] = Field(..., description="趋势")


class AcademicRecordInput(BaseModel):
    """R14：学情导入单行（按 student_no upsert）。"""

    student_no: str = Field(..., min_length=1, description="学号")
    scores: list[SubjectScore] = Field(..., description="各科成绩")
    role: Literal["member", "group_leader", "class_committee", "subject_rep"] = Field(
        ..., description="校内角色"
    )
    background: str = Field(default="", description="背景信息（AI 对话上下文）")
    teacher_note: str = Field(default="", description="教师评语")


class ManualAcademicEntry(BaseModel):
    """教师手动录入学情档案（支持在册或新增学生）。"""

    name: str = Field(..., min_length=1, max_length=50, description="姓名")
    student_no: str | None = Field(default=None, description="学号（可空，缺省自动生成）")
    scores: list[SubjectScore] = Field(..., description="各科成绩")
    role: Literal["member", "group_leader", "class_committee", "subject_rep"] = Field(
        ..., description="校内角色"
    )
    background: str = Field(default="", description="背景信息")
    teacher_note: str = Field(default="", description="教师评语")


class AcademicRecord(BaseModel):
    """R14/R15：学情档案。"""

    student_id: str = Field(..., description="学生 ID")
    student_no: str = Field(..., description="学号")
    name: str = Field(..., description="姓名")
    role: Literal["member", "group_leader", "class_committee", "subject_rep"] = Field(
        ..., description="校内角色"
    )
    scores: list[SubjectScore] = Field(..., description="各科成绩")
    background: str = Field(..., description="背景信息（AI 对话上下文）")
    teacher_note: str = Field(..., description="教师评语")
    updated_at: datetime = Field(..., description="更新时间")


class AcademicSummary(BaseModel):
    """R15：班级学情汇总。"""

    records: list[AcademicRecord] = Field(..., description="学情记录列表")
    summary: dict[str, Any] = Field(..., description="汇总统计")
