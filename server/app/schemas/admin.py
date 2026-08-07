"""管理员后台 schemas（方案 5.3）。"""

from pydantic import BaseModel, Field


class AdminLoginReq(BaseModel):
    password: str = Field(..., description="管理员密码")


class AdminLoginResp(BaseModel):
    session_token: str = Field(..., description="管理员会话 token（ad_ 前缀）")
    expires_at: str = Field(..., description="过期时间 ISO 串")


class ServiceConfig(BaseModel):
    """模型服务当前生效配置（env 默认 + DB 覆盖）。"""

    voice_provider: str = "local"
    dashscope_api_key: str = ""
    dashscope_realtime_url: str = ""
    voice_model: str = ""
    text_provider: str = "template"
    text_model: str = ""
    text_base_url: str = ""
    text_api_key: str = ""
    image_provider: str = "placeholder"
    image_model: str = ""
    image_base_url: str = ""
    image_api_key: str = ""


class ServiceConfigUpdate(BaseModel):
    """部分更新模型配置；未提供的字段保持不变。"""

    voice_provider: str | None = None
    dashscope_api_key: str | None = None
    dashscope_realtime_url: str | None = None
    voice_model: str | None = None
    text_provider: str | None = None
    text_model: str | None = None
    text_base_url: str | None = None
    text_api_key: str | None = None
    image_provider: str | None = None
    image_model: str | None = None
    image_base_url: str | None = None
    image_api_key: str | None = None
