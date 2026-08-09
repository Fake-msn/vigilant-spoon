"""用真实人声 wav 测试 DashScope realtime 转录。"""
import asyncio
import base64
import json
import wave

import websockets

API_KEY = "sk-ws-H.ERPPPDX.IAPG.MEQCIHE1JBWxxaZNItlxD7kQuk8CIAhZzogeZUL_4Q3YD-7WAiBWbkc32NrqXDpT6pJ_dKLtEA9JPJZs1b2ayub9N6D1eg"
MODEL = "qwen3.5-omni-flash-realtime"
URL = f"wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model={MODEL}"
import os
WAV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_speech.wav")


def wav_to_pcm16(path) -> bytes:
    with wave.open(path, "rb") as w:
        assert w.getsampwidth() == 2, "must be 16-bit"
        rate = w.getframerate()
        ch = w.getnchannels()
        data = w.readframes(w.getnframes())
    # 若立体声取单声道
    if ch == 2:
        mono = bytearray(len(data) // 2)
        for i in range(len(data) // 4):
            mono[i * 2] = data[i * 4]
            mono[i * 2 + 1] = data[i * 4 + 1]
        data = bytes(mono)
    print(f"[wav] rate={rate} ch={ch} pcm16_bytes={len(data)}")
    return data


async def main():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "X-DashScope-DataInspection": "disable",
    }
    async with websockets.connect(URL, additional_headers=headers) as ws:
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "instructions": "你是测试助手",
                "modalities": ["audio", "text"],
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm24",
                "voice": "Cherry",
                "input_audio_transcription": {"model": "gummy-realtime-v1"},
                "turn_detection": {"type": "server_vad", "threshold": 0.2, "silence_duration_ms": 800},
            },
        }, ensure_ascii=False))

        for _ in range(30):
            msg = await asyncio.wait_for(ws.recv(), timeout=5)
            txt = msg.decode("utf-8") if isinstance(msg, bytes) else msg
            data = json.loads(txt)
            print(f"[raw] <- {data.get('type')}")
            if data.get("type") == "session.updated":
                break

        pcm = wav_to_pcm16(WAV)
        b64 = base64.b64encode(pcm).decode()
        # 分块发送（100ms = 3200 字节）
        for i in range(0, len(b64), 50000):
            await ws.send(json.dumps({"type": "input_audio_buffer.append", "audio": b64[i:i+50000]}))
        print("[raw] sent full audio in chunks")
        import time
        time.sleep(1.5)
        await ws.send(json.dumps({"type": "input_audio_buffer.commit"}))
        print("[raw] sent commit")

        for _ in range(40):
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
            except asyncio.TimeoutError:
                print("[raw] (timeout)")
                break
            txt = msg.decode("utf-8") if isinstance(msg, bytes) else msg
            try:
                data = json.loads(txt)
            except json.JSONDecodeError:
                continue
            print(f"[raw] <- {data.get('type')} {str(data)[:200]}")
        print("[raw] done")


asyncio.run(main())