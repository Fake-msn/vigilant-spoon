"""Application configuration."""

from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_path: str = str(Path(__file__).resolve().parent.parent / "data" / "demo.db")

    # ---- 1. 语音 realtime（F2）----
    voice_provider: str = "local"  # local | dashscope
    dashscope_api_key: str | None = None
    dashscope_realtime_url: str = "wss://dashscope.aliyuncs.com/api-ws/v1/realtime"
    voice_model: str = "qwen3.5-omni-flash-realtime"

    # ---- 2. 文本生成 LLM（书信 / 备课 / 评分，方案 5.1）----
    text_provider: str = "template"  # template | dashscope | openai
    text_model: str = "qwen-plus"
    text_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    text_api_key: str | None = None

    # ---- 3. 文生图（班宠画像，方案 5.2）----
    image_provider: str = "placeholder"  # placeholder | dashscope
    image_model: str = "wanx2.1-t2i-turbo"
    image_base_url: str = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image"
    image_api_key: str | None = None

    # ---- 4. 管理员后台（方案 5.3）----
    admin_password: str = "admin123"  # 管理员后台登录密码


settings = Settings()
