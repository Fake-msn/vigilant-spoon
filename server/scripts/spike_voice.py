"""F2-01 spike：验证 qwen3.5-omni-flash-realtime 连通性与首响延迟。

用法（不要硬编码 key）：
    DASHSCOPE_API_KEY=... python scripts/spike_voice.py
"""
from __future__ import annotations

import asyncio
import json
import os
import time

import websockets

BASE_URL = "wss://dashscope.aliyuncs.com/api-ws/v1/realtime"
MODEL = "qwen3.5-omni-flash-realtime"


async def main() -> None:
    api_key = os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        raise SystemExit("请设置环境变量 DASHSCOPE_API_KEY")

    uri = f"{BASE_URL}?model={MODEL}"
    headers = {"Authorization": f"Bearer {api_key}"}

    print(f"连接 {uri} ...")
    t0 = time.perf_counter()
    async with websockets.connect(uri, additional_headers=headers) as ws:
        # 配置 session：纯文本即可验证连通性
        await ws.send(json.dumps({"type": "session.update", "session": {"modalities": ["text"]}}))

        # 发送一条用户消息并请求响应
        await ws.send(
            json.dumps(
                {
                    "type": "conversation.item.create",
                    "item": {
                        "type": "message",
                        "role": "user",
                        "content": [{"type": "input_text", "text": "你好，请用一句话打招呼"}],
                    },
                }
            )
        )
        await ws.send(json.dumps({"type": "response.create"}))

        transcript = ""
        audio_count = 0
        async for raw in ws:
            event = json.loads(raw)
            print(f"event: {event.get('type')}")
            if event.get("type") == "response.text.delta":
                transcript += event.get("delta", "")
            elif event.get("type") == "response.audio.delta":
                audio_count += 1
            elif event.get("type") == "response.done":
                break

    latency = time.perf_counter() - t0
    print(f"首响总延迟（连接+首条文本）: {latency:.2f}s")
    print(f"文本内容: {transcript[:120]!r}")
    print(f"音频片段数: {audio_count}")


if __name__ == "__main__":
    asyncio.run(main())
