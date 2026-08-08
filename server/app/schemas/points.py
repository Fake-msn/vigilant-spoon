"""班宠积分制度 schema（可配置规则/流水/小组/排行榜）。"""

from datetime import datetime

from pydantic import BaseModel, Field


class PointRule(BaseModel):
    rule_id: str = Field(..., description="规则 ID")
    name: str = Field(..., description="规则名")
    points: int = Field(..., description="积分（±）")
    category: str | None = Field(default=None, description="行为分类")
    enabled: bool = Field(..., description="是否启用")


class PointRuleUpsert(BaseModel):
    rule_id: str | None = Field(default=None, description="缺省则新建")
    name: str = Field(..., min_length=1, max_length=50, description="规则名")
    points: int = Field(..., description="积分（±）")
    category: str | None = Field(default=None, description="行为分类")
    enabled: bool = Field(default=True, description="是否启用")


class PointRuleUpdateReq(BaseModel):
    rules: list[PointRuleUpsert] = Field(..., description="全量规则（整表替换）")


class PointLedgerEntry(BaseModel):
    id: int = Field(..., description="流水 ID")
    name: str = Field(..., description="规则名快照")
    points: int = Field(..., description="本次变动")
    note: str | None = Field(default=None, description="备注")
    created_at: datetime = Field(..., description="发生时间")


class PointAwardReq(BaseModel):
    student_id: str = Field(..., min_length=1, description="学生 ID")
    rule_id: str | None = Field(default=None, description="规则 ID（可空）")
    points: int | None = Field(default=None, description="分值（缺省用规则分值）")
    name: str | None = Field(default=None, description="展示名（缺省用规则名）")
    note: str | None = Field(default=None, description="备注")


class PointAwardResp(BaseModel):
    student_id: str = Field(..., description="学生 ID")
    points: int = Field(..., description="本次变动")
    points_total: int = Field(..., description="累计积分")
    level: int = Field(..., description="当前等级")
    leveled_up: bool = Field(..., description="本次是否升级")
    hunger: int = Field(..., description="饥饿度 0-100")
    mood: int = Field(..., description="心情 0-100")
    state: str = Field(..., description="宠物三态")
    ledger_id: int = Field(..., description="流水 ID")


class GroupView(BaseModel):
    group_id: str = Field(..., description="小组 ID")
    group_name: str = Field(..., description="小组名")
    color: str | None = Field(default=None, description="颜色")
    members: list[str] = Field(..., description="成员 student_id 列表")


class GroupCreate(BaseModel):
    group_name: str = Field(..., min_length=1, max_length=30, description="小组名")
    color: str | None = Field(default=None, description="颜色")


class GroupConfigReq(BaseModel):
    groups: list[GroupCreate] = Field(..., description="小组列表（整班替换）")
    assignments: dict[str, str] = Field(..., description="student_id -> group_id")


class LeaderboardItem(BaseModel):
    group_id: str = Field(..., description="小组 ID")
    group_name: str = Field(..., description="小组名")
    color: str | None = Field(default=None, description="颜色")
    total_points: int = Field(..., description="小组积分汇总")
    member_count: int = Field(..., description="成员数")


class LeaderboardView(BaseModel):
    items: list[LeaderboardItem] = Field(..., description="按积分降序")


class PointOverview(BaseModel):
    rules: list[PointRule] = Field(..., description="启用的规则")
    students: list[dict[str, object]] = Field(..., description="学生 id/name/groups")
    groups: list[GroupView] = Field(..., description="小组")
