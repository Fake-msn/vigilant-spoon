"""端到端：走后端 WS，发送真实人声，验证 transcript/audio_chunk。"""
import asyncio
import base64
import json
import os
import wave

import httpx
from websockets.asyncio.client import connect

BASE = "http://127.0.0.1:8010"
# 通过 Vite 代理(5173)连接 WS，验证二进制帧是否被正确转发
WS = "ws://localhost:5173/api/ws/voice"
WAV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_speech.wav")


def wav_to_pcm16(path, target_rate: int = 16000) -> bytes:
    """读取 wav 并重采样/降混为 target_rate 单声道 PCM16。"""
    import audioop
    with wave.open(path, "rb") as w:
        ch = w.getnchannels()
        rate = w.getframerate()
        sampwidth = w.getsampwidth()
        data = w.readframes(w.getnframes())
    # 降混为单声道
    if ch == 2:
        data = audioop.tomono(data, sampwidth, 1, 0)
    # 重采样到目标采样率
    if rate != target_rate:
        data, _ = audioop.ratecv(data, sampwidth, 1, rate, target_rate, None)
    return data


def get_token() -> str:
    r = httpx.post(f"{BASE}/api/session/enter", json={"class_code": "LTZ2024", "student_name": "王小雅"}, timeout=10)
    r.raise_for_status()
    return str(r.json()["session_token"])


async def main() -> None:
    token = get_token()
    url = f"{WS}?token={token}&student_id=wxy&mode=classroom"
    print(f"connecting: {url}", flush=True)
    pcm = wav_to_pcm16(WAV)
    print(f"[wav] pcm16 bytes={len(pcm)}", flush=True)
    sent_audio = False
    async with connect(url) as ws:
        received = []
        try:
            for _ in range(120):
                msg = await asyncio.wait_for(ws.recv(), timeout=8)
                if isinstance(msg, bytes):
                    continue
                data = json.loads(msg)
                received.append(data["type"])
                print(f"  <- {data['type']} {str(data.get('text',''))[:60]}", flush=True)
                if data["type"] == "session_started" and not sent_audio:
                    sent_audio = True
                    print(f"  -> streaming {len(pcm)} bytes (16kHz) in chunks", flush=True)
                    # 分块发送，模拟真实录音流（每块 3200 字节 = 100ms@16kHz）
                    chunk_size = 3200
                    for i in range(0, len(pcm), chunk_size):
                        await ws.send(pcm[i:i + chunk_size])
                        await asyncio.sleep(0.1)
                    print("  -> all chunks sent, waiting for response", flush=True)
                if data["type"] == "session_end":
                    break
        except asyncio.TimeoutError:
            print("  (timeout waiting for more events)", flush=True)
        n = len(received)
        print(f"\nreceived {n} events: {received}", flush=True)
        print("session_started:", "session_started" in received)
        print("vad_start:", "vad_start" in received)
        print("transcript:", "transcript" in received)
        print("audio_chunk:", "audio_chunk" in received)
        print("turn_end:", "turn_end" in received)


if __name__ == "__main__":
    asyncio.run(main())