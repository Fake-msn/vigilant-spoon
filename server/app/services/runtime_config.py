"""运行时模型配置：env 默认 + DB 覆盖（方案 5.3）。

优先级：`service_config`(DB) > `Settings`(env 默认)。
未写入 DB 的项回退到 Settings 默认值，保证未配置后台时系统行为不变。
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.config import settings
from app.db import get_db_connection

logger = logging.getLogger("runtime_config")

# 允许在管理员后台配置的键（与 Settings 字段一一对应）
CONFIG_KEYS: tuple[str, ...] = (
    # 语音 realtime
    "voice_provider",
    "dashscope_api_key",
    "dashscope_realtime_url",
    "voice_model",
    # 文本生成 LLM
    "text_provider",
    "text_model",
    "text_base_url",
    "text_api_key",
    # 文生图
    "image_provider",
    "image_model",
    "image_base_url",
    "image_api_key",
)


def _defaults() -> dict[str, str]:
    """以 Settings（env 默认）为基准，API key 为空则归一化为空串。"""
    return {
        "voice_provider": settings.voice_provider,
        "dashscope_api_key": settings.dashscope_api_key or "",
        "dashscope_realtime_url": settings.dashscope_realtime_url,
        "voice_model": settings.voice_model,
        "text_provider": settings.text_provider,
        "text_model": settings.text_model,
        "text_base_url": settings.text_base_url,
        "text_api_key": settings.text_api_key or "",
        "image_provider": settings.image_provider,
        "image_model": settings.image_model,
        "image_base_url": settings.image_base_url,
        "image_api_key": settings.image_api_key or "",
    }


def get_config() -> dict[str, str]:
    """返回当前生效配置（DB 覆盖 env 默认）。"""
    cfg = _defaults()
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT key, value FROM service_config").fetchall()
        for row in rows:
            key = str(row["key"])
            if key in cfg:
                cfg[key] = str(row["value"])
    finally:
        conn.close()
    return cfg


def set_config(values: dict[str, str]) -> dict[str, str]:
    """将配置覆写到 DB，返回更新后的完整配置。"""
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    try:
        for key, value in values.items():
            if key not in CONFIG_KEYS:
                logger.warning("忽略未知配置键: %r", key)
                continue
            conn.execute(
                """
                INSERT INTO service_config (key, value, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = excluded.updated_at
                """,
                (key, str(value), now),
            )
        conn.commit()
    finally:
        conn.close()
    return get_config()


def get(key: str) -> str:
    """读取单个配置项（DB 优先，env 回退）。"""
    return get_config().get(key, "")
