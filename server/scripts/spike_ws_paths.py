"""尝试几个可能的 DashScope realtime WebSocket endpoint。"""
import asyncio
import os

import websockets

KEY = os.environ.get("DASHSCOPE_API_KEY")
MODEL = "qwen3.5-omni-flash-realtime"

CANDIDATES = [
    f"wss://dashscope.aliyuncs.com/compatible-mode/v1/realtime?model={MODEL}",
    f"wss://dashscope.aliyuncs.com/compatible-mode/v1/realtime/realtime?model={MODEL}",
    f"wss://dashscope.aliyuncs.com/compatible-mode/realtime?model={MODEL}",
    f"wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model={MODEL}",
]


async def try_url(url: str) -> None:
    try:
        async with websockets.connect(
            url,
            additional_headers={"Authorization": f"Bearer {KEY}"},
        ) as ws:
            print(f"OK  {url}")
            await ws.close()
    except Exception as exc:
        print(f"ERR {url} -> {type(exc).__name__}: {exc}")


async def main() -> None:
    if not KEY:
        raise SystemExit("请设置 DASHSCOPE_API_KEY")
    await asyncio.gather(*(try_url(u) for u in CANDIDATES))


if __name__ == "__main__":
    asyncio.run(main())
