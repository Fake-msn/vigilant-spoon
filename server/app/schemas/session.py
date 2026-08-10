"""Session / identity schemas (R1, R2)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.growth import PetState


class StudentProfile(BaseModel):
    """学生 profile（light 视图，A2 新增 role/grade/region/ideal）。"""

    id: str = Field(..., description="学生唯一标识")
    name: str = Field(..., description="学生姓名")
    student_no: str = Field(..., description="学号")
    class_code: str = Field(..., description="班级码")
    avatar_seed: int = Field(..., ge=0, description="像素头像种子")
    role: Literal["member", "group_leader", "class_committee", "subject_rep"] = Field(
        ..., description="校内角色"
    )
    grade: str = Field(..., description="年级")
    region_key: str = Field(..., description="地区 key")
    region_name: str = Field(..., description="地区名称")
    ideal: str | None = Field(default=None, description="理想")
    custom_avatar_url: str | None = Field(default=None, description="自定义头像 URL")


class TeacherProfile(BaseModel):
    """教师 profile（演示期无账号密码）"""

    id: str = Field(..., description="教师唯一标识")
    name: str = Field(..., description="教师姓名")
    role: Literal["teacher"] = Field(default="teacher", description="角色")
    class_code: str = Field(..., description="班级码")
    class_name: str = Field(..., description="班级名称")
    school: str = Field(..., description="学校")
    region_key: str = Field(..., description="地区 key")
    region_name: str = Field(..., description="地区名称")


class ClassInfo(BaseModel):
    """R1：班级与学生名单。"""

    class_code: str = Field(..., description="班级码")
    class_name: str = Field(..., description="班级名称")
    school: str = Field(..., description="学校")
    region_key: str = Field(..., description="地区 key")
    region_name: str = Field(..., description="地区名称")
    grade: str = Field(..., description="年级")
    class_no: str = Field(..., description="班级序号")
    students: list[StudentProfile] = Field(..., description="学生名单")


class StudentCreate(BaseModel):
    """教师建班时录入的学生（学号/角色由后端生成，避免跨班冲突）。"""

    name: str = Field(..., min_length=1, description="学生姓名")
    grade: str = Field(..., min_length=1, description="年级")
    avatar_seed: int = Field(default=0, ge=0, description="头像种子")
    ideal: str | None = Field(default=None, description="理想")


class ClassCreateReq(BaseModel):
    """教师建班请求：地区 + 学校班级 + 学生名单。"""

    class_name: str = Field(..., min_length=1, description="班级名称")
    school: str = Field(..., min_length=1, description="学校")
    region_key: str = Field(..., min_length=1, description="地区 key")
    city: str = Field(default="", description="市/州")
    county: str = Field(default="", description="区/县")
    town: str = Field(default="", description="乡/镇")
    grade: str = Field(..., min_length=1, description="年级")
    class_no: str = Field(..., min_length=1, description="班级序号")
    students: list[StudentCreate] = Field(..., min_length=1, description="学生名单")


class ClassCreateResp(BaseModel):
    """教师建班响应：返回新班级码及班级信息。"""

    class_code: str = Field(..., description="班级码")
    class_name: str = Field(..., description="班级名称")
    school: str = Field(..., description="学校")
    region_key: str = Field(..., description="地区 key")
    region_name: str = Field(..., description="地区名称")
    grade: str = Field(..., description="年级")
    class_no: str = Field(..., description="班级序号")
    students: list[StudentProfile] = Field(..., description="学生名单")


class ClassPetView(BaseModel):
    """R17：班级宠物墙单项（禁评分字段）。"""

    student_id: str = Field(..., description="学生 ID")
    name: str = Field(..., description="姓名")
    avatar_seed: int = Field(..., ge=0, description="头像种子")
    pet: "PetState" = Field(..., description="宠物状态")


class EnterReq(BaseModel):
    """R2：进入教室请求。"""

    class_code: str = Field(..., min_length=1, description="班级码")
    student_name: str = Field(..., min_length=1, description="学生姓名，精确匹配")


class EnterResp(BaseModel):
    """R2：进入教室响应。"""

    session_token: str = Field(
        ...,
        pattern=r"^st_[A-Za-z0-9_-]{40,}$",
        examples=["st_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"],
        description="opaque session token，12h 有效",
    )
    profile: StudentProfile = Field(..., description="学生 light profile")
    expires_at: datetime = Field(..., description="token 过期时间，ISO 8601 带时区")


class TeacherEnterReq(BaseModel):
    """教师登录请求（指定班级 + 可选密码）"""

    class_code: str = Field(..., min_length=1, description="班级码")
    teacher_name: str = Field(default="李老师", min_length=1, description="教师姓名")
    password: str | None = Field(default=None, description="密码（账号设置了密码时必填）")


class TeacherLoginReq(BaseModel):
    """不指定班级的教师登录请求（按姓名+密码校验，默认进入首个任教班级）"""

    teacher_name: str = Field(..., min_length=1, description="教师姓名")
    password: str | None = Field(default=None, description="密码（账号设置了密码时必填）")


class TeacherEnterResp(BaseModel):
    """教师演示登录响应"""

    session_token: str = Field(
        ...,
        pattern=r"^st_[A-Za-z0-9_-]{40,}$",
        description="opaque session token，12h 有效",
    )
    profile: TeacherProfile = Field(..., description="教师 profile")
    expires_at: datetime = Field(..., description="token 过期时间")


class TeacherClassView(BaseModel):
    """教师账号下管理的单个班级。"""

    class_code: str = Field(..., description="班级码")
    class_name: str = Field(..., description="班级名称")
    school: str = Field(..., description="学校")
    region_key: str = Field(default="", description="地区标识（省级 key）")
    city: str = Field(default="", description="市/州")
    county: str = Field(default="", description="区/县")
    town: str = Field(default="", description="乡/镇")
    grade: str = Field(..., description="年级")
    class_no: str = Field(..., description="班级序号")


class TeacherClassesResp(BaseModel):
    """教师账号概览：教师本人信息 + 任教班级列表。"""

    teacher_id: str = Field(..., description="教师唯一标识")
    name: str = Field(..., description="教师姓名")
    school: str = Field(..., description="当前班级学校")
    classes: list[TeacherClassView] = Field(..., description="任教班级列表")


class TeacherSwitchReq(BaseModel):
    """教师在任教班级间切换当前班级。"""

    class_code: str = Field(..., min_length=1, description="目标班级码")


class TeacherRegisterReq(BaseModel):
    """教师注册请求：必填姓名，个人信息与密码可选。"""

    name: str = Field(..., min_length=1, max_length=50, description="教师姓名")
    school: str = Field(default="", max_length=100, description="学校（可选）")
    phone: str = Field(default="", max_length=30, description="联系电话（可选）")
    subject: str = Field(default="", max_length=50, description="任教学科（可选）")
    title: str = Field(default="", max_length=30, description="职称（可选）")
    password: str | None = Field(
        default=None, max_length=64, description="登录密码（可选，设置后登录需校验）"
    )


class TeacherAccount(BaseModel):
    """教师账号信息（个人设置）。"""

    teacher_id: str = Field(..., description="教师唯一标识")
    name: str = Field(..., description="教师姓名")
    school: str = Field(default="", description="学校")
    phone: str = Field(default="", description="联系电话")
    subject: str = Field(default="", description="任教学科")
    title: str = Field(default="", description="职称")
    has_password: bool = Field(..., description="是否已设置密码")
    status: Literal["pending", "active", "rejected"] = Field(
        default="active", description="账号审核状态"
    )


class PendingTeacherReview(BaseModel):
    """管理员审核列表中的待审教师条目。"""

    teacher_id: str = Field(..., description="教师唯一标识")
    name: str = Field(..., description="教师姓名")
    school: str = Field(default="", description="学校")
    phone: str = Field(default="", description="联系电话")
    subject: str = Field(default="", description="任教学科")
    title: str = Field(default="", description="职称")
    created_at: str = Field(default="", description="注册时间")


class PendingTeacherReviewList(BaseModel):
    """待管理员审核的教师注册列表。"""

    items: list[PendingTeacherReview] = Field(default_factory=list, description="待审教师列表")


class TeacherReviewReq(BaseModel):
    """管理员审核教师注册请求。"""

    approve: bool = Field(..., description="是否通过")
    reject_reason: str | None = Field(
        default=None, max_length=200, description="驳回原因（驳回时可选）"
    )


class TeacherAccountUpdateReq(BaseModel):
    """更新教师个人信息（均可选）。"""

    school: str | None = Field(default=None, max_length=100, description="学校")
    phone: str | None = Field(default=None, max_length=30, description="联系电话")
    subject: str | None = Field(default=None, max_length=50, description="任教学科")
    title: str | None = Field(default=None, max_length=30, description="职称")


class TeacherPasswordUpdateReq(BaseModel):
    """设置 / 修改教师密码（可选）。"""

    old_password: str | None = Field(default=None, description="旧密码（已设置密码时必填）")
    new_password: str = Field(..., min_length=4, max_length=64, description="新密码")
