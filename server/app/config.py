"""Application configuration."""

from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_path: str = str(Path(__file__).resolve().parent.parent / "data" / "demo.db")

    # F2 语音配置
    voice_provider: str = "local"  # local | dashscope
    dashscope_api_key: str | None = None
    dashscope_realtime_url: str = "wss://dashscope.aliyuncs.com/api-ws/v1/realtime"
    voice_model: str = "qwen3.5-omni-flash-realtime"


settings = Settings()
