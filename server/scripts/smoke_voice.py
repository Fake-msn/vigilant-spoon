"""本地语音 WS 功能验证脚本（针对运行中的后端）。"""
import asyncio
import json

import httpx
from websockets.asyncio.client import connect

BASE = "http://127.0.0.1:8010"
WS = "ws://127.0.0.1:8010/api/ws/voice"


def get_token() -> str:
    r = httpx.post(f"{BASE}/api/session/enter", json={"class_code": "LTZ2024", "student_name": "王小雅"}, timeout=10)
    r.raise_for_status()
    return str(r.json()["session_token"])


async def main() -> None:
    token = get_token()
    url = f"{WS}?token={token}&student_id=wxy&mode=classroom"
    print(f"connecting: {url}")
    async with connect(url) as ws:
        received = []
        try:
            for _ in range(60):
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
                if isinstance(msg, bytes):
                    continue
                data = json.loads(msg)
                received.append(data["type"])
                print(f"  <- {data['type']} {data.get('text', '')}")
                if data["type"] == "session_started":
                    # 发送一小段静音 PCM16 与 commit_turn，模拟学生说话
                    await ws.send(b"\x00\x00" * 1600)  # 16kHz 0.1s 静音
                    await ws.send(json.dumps({"type": "commit_turn"}))
                if data["type"] == "session_end":
                    break
        except asyncio.TimeoutError:
            print("  (timeout waiting for more events)")
        n = len(received)
        print(f"\nreceived {n} events: {received}")
        assert "session_started" in received, "缺少 session_started"
        assert "transcript" in received, "缺少 transcript"
        assert "turn_end" in received, "缺少 turn_end"
        assert "session_end" in received, "缺少 session_end"
        print("VOICE_WS_OK")


if __name__ == "__main__":
    asyncio.run(main())