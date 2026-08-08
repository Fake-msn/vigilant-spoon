"""文本生成 LLM 统一封装（方案 5.1）。

- `text_provider=template`：返回 None，由调用方回退到确定性模板。
- `text_provider=dashscope`：走 OpenAI 兼容协议（base_url 指向 compatible-mode）。
- `text_provider=openai`：走原生 OpenAI SDK。

任何失败（未配置 key / 调用异常 / 空响应）均返回 None，保证演示铁律：
未配置 key 时系统仍可经由模板完整稳定运行。
"""

from __future__ import annotations

import logging

from app.services import runtime_config

logger = logging.getLogger("llm")


def chat_completion(
    system_prompt: str,
    user_prompt: str,
    *,
    max_tokens: int = 1024,
    temperature: float = 0.7,
) -> str | None:
    """调用文本 LLM 返回纯文本；未配置或失败时返回 None。"""
    provider = runtime_config.get("text_provider")
    if provider == "template":
        return None
    if provider not in ("dashscope", "openai"):
        logger.warning("未知 text_provider=%r，回退模板", provider)
        return None

    api_key = runtime_config.get("text_api_key")
    if not api_key:
        logger.info("text_api_key 未配置（provider=%s），回退模板", provider)
        return None

    try:
        from openai import OpenAI
    except ImportError:
        logger.exception("未安装 openai SDK，回退模板")
        return None

    try:
        client = OpenAI(
            api_key=api_key,
            base_url=(
                runtime_config.get("text_base_url")
                if provider == "dashscope"
                else None
            ),
        )
        resp = client.chat.completions.create(
            model=runtime_config.get("text_model"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        content = resp.choices[0].message.content
        return content.strip() if content else None
    except Exception:
        logger.exception("LLM 调用失败，回退模板")
        return None
