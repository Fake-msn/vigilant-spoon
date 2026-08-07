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
    embed_provider: str = "disabled"
    embed_model: str = ""
    embed_base_url: str = ""
    embed_api_key: str = ""


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
    embed_provider: str | None = None
    embed_model: str | None = None
    embed_base_url: str | None = None
    embed_api_key: str | None = None


class KnowledgeDocCreate(BaseModel):
    title: str = Field(..., min_length=1, description="文档标题")
    content: str = Field(..., min_length=1, description="文档正文")
    category: str = Field("general", description="分类：lesson/comment/classroom/general")
    source: str = Field("manual", description="来源")


class KnowledgeDoc(BaseModel):
    doc_id: str
    title: str
    category: str
    source: str
    chunk_count: int
    created_at: str


class KnowledgeDocList(BaseModel):
    items: list[KnowledgeDoc]
    total: int


class KnowledgeStatus(BaseModel):
    embed_provider: str
    embed_model: str
    configured: bool
    doc_count: int
    chunk_count: int
