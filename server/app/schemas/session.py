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
    """教师演示登录请求（无密码）"""

    class_code: str = Field(..., min_length=1, description="班级码")
    teacher_name: str = Field(default="李老师", min_length=1, description="教师姓名")


class TeacherEnterResp(BaseModel):
    """教师演示登录响应"""

    session_token: str = Field(
        ...,
        pattern=r"^st_[A-Za-z0-9_-]{40,}$",
        description="opaque session token，12h 有效",
    )
    profile: TeacherProfile = Field(..., description="教师 profile")
    expires_at: datetime = Field(..., description="token 过期时间")
