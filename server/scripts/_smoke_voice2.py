"""本地语音 WS 功能验证（发送正弦波触发真实语音识别）。"""
import asyncio
import json
import math
import struct

import httpx
from websockets.asyncio.client import connect

BASE = "http://127.0.0.1:8010"
WS = "ws://127.0.0.1:8010/api/ws/voice"


def get_token() -> str:
    r = httpx.post(f"{BASE}/api/session/enter", json={"class_code": "LTZ2024", "student_name": "王小雅"}, timeout=10)
    r.raise_for_status()
    return str(r.json()["session_token"])


def sine_pcm16(seconds: float, rate: int = 16000, freq: float = 440.0, amp: float = 0.3) -> bytes:
    """生成一段正弦波 PCM16 音频，模拟说话声。"""
    n = int(seconds * rate)
    frames = bytearray()
    for i in range(n):
        v = amp * math.sin(2 * math.pi * freq * i / rate)
        frames += struct.pack("<h", int(v * 32767))
    return bytes(frames)


async def main() -> None:
    token = get_token()
    url = f"{WS}?token={token}&student_id=wxy&mode=classroom"
    print(f"connecting: {url}")
    async with connect(url) as ws:
        received = []
        try:
            for _ in range(120):
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
                if isinstance(msg, bytes):
                    print(f"  <- binary {len(msg)} bytes")
                    continue
                data = json.loads(msg)
                received.append(data["type"])
                print(f"  <- {data['type']} {data.get('text', '')[:60]}")
                if data["type"] == "session_started":
                    # 发送 2 秒正弦波（440Hz）模拟一次说话，然后提交
                    await ws.send(sine_pcm16(2.0))
                    await asyncio.sleep(0.5)
                    await ws.send(json.dumps({"type": "commit_turn"}))
                if data["type"] == "session_end":
                    break
        except asyncio.TimeoutError:
            print("  (timeout waiting for more events)")
        n = len(received)
        print(f"\nreceived {n} events: {received}")
        assert "session_started" in received, "缺少 session_started"
        assert "vad_start" in received, "缺少 vad_start"
        assert "transcript" in received, "缺少 transcript"
        assert "turn_end" in received, "缺少 turn_end"
        print("VOICE_WS_OK")


if __name__ == "__main__":
    asyncio.run(main())