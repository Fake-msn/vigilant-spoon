"""直接读 DashScope raw websocket 消息，确认服务端返回内容。"""
import asyncio
import base64
import json
import math
import struct

import websockets

API_KEY = "sk-ws-H.ERPPPDX.IAPG.MEQCIHE1JBWxxaZNItlxD7kQuk8CIAhZzogeZUL_4Q3YD-7WAiBWbkc32NrqXDpT6pJ_dKLtEA9JPJZs1b2ayub9N6D1eg"
MODEL = "qwen3.5-omni-flash-realtime"
URL = f"wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model={MODEL}"


def sine_pcm16(seconds, rate=16000, freq=440.0, amp=0.5):
    n = int(seconds * rate)
    frames = bytearray()
    for i in range(n):
        v = amp * math.sin(2 * math.pi * freq * i / rate)
        frames += struct.pack("<h", int(v * 32767))
    return bytes(frames)


async def main():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "X-DashScope-DataInspection": "disable",
    }
    async with websockets.connect(URL, additional_headers=headers) as ws:
        # session.update
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "instructions": "你是测试助手",
                "modalities": ["audio", "text"],
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm24",
                "voice": "Cherry",
                "input_audio_transcription": {"model": "gummy-realtime-v1"},
                "turn_detection": {"type": "server_vad", "threshold": 0.5, "silence_duration_ms": 800},
            },
        }, ensure_ascii=False))

        got = set()
        # 读 session.created / updated
        for _ in range(30):
            msg = await asyncio.wait_for(ws.recv(), timeout=5)
            txt = msg if isinstance(msg, str) else msg.decode("utf-8")
            data = json.loads(txt)
            print(f"[raw] <- {data.get('type')}")
            got.add(data.get("type"))
            if data.get("type") == "session.updated":
                break

        # 发送音频（多频混合模拟语音）
        data = bytearray()
        for freq, dur in [(220, 0.8), (330, 0.8), (440, 0.8), (550, 0.8)]:
            data += sine_pcm16(dur, freq=freq, amp=0.6)
        b64 = base64.b64encode(bytes(data)).decode()
        await ws.send(json.dumps({"type": "input_audio_buffer.append", "audio": b64}))
        print("[raw] sent audio append (multi-freq)")
        await asyncio.sleep(1.0)
        await ws.send(json.dumps({"type": "input_audio_buffer.commit"}))
        print("[raw] sent commit")

        # 读事件
        for _ in range(30):
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
            except asyncio.TimeoutError:
                print("[raw] (timeout)")
                break
            txt = msg if isinstance(msg, str) else msg.decode("utf-8")
            try:
                data = json.loads(txt)
            except json.JSONDecodeError:
                print(f"[raw] non-json: {txt[:200]}")
                continue
            print(f"[raw] <- {data.get('type')} {str(data)[:200]}")
            got.add(data.get("type"))
        print(f"[raw] got: {got}")


asyncio.run(main())