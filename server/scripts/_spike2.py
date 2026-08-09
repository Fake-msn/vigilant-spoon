"""直接调用 DashScopeRealtimeModel.send 发送音频，验证 DashScope 是否响应。"""
import asyncio
import base64
import math
import struct

from agentscope.message import AudioBlock, Base64Source
from agentscope.realtime import DashScopeRealtimeModel

API_KEY = "sk-ws-H.ERPPPDX.IAPG.MEQCIHE1JBWxxaZNItlxD7kQuk8CIAhZzogeZUL_4Q3YD-7WAiBWbkc32NrqXDpT6pJ_dKLtEA9JPJZs1b2ayub9N6D1eg"
MODEL = "qwen3.5-omni-flash-realtime"


def sine_pcm16(seconds, rate=16000, freq=440.0, amp=0.5):
    n = int(seconds * rate)
    frames = bytearray()
    for i in range(n):
        v = amp * math.sin(2 * math.pi * freq * i / rate)
        frames += struct.pack("<h", int(v * 32767))
    return bytes(frames)


async def main():
    model = DashScopeRealtimeModel(model_name=MODEL, api_key=API_KEY)
    out = asyncio.Queue()
    await model.connect(out, "你是测试助手")
    print("[spike2] connected, sending audio via model.send...")
    b64 = base64.b64encode(sine_pcm16(2.0)).decode()
    await model.send(AudioBlock(
        type="audio",
        source=Base64Source(type="base64", media_type="audio/pcm", data=b64),
    ))
    seen = []
    for _ in range(40):
        try:
            ev = await asyncio.wait_for(out.get(), timeout=5)
        except asyncio.TimeoutError:
            print("[spike2] (timeout)")
            break
        seen.append(ev.__class__.__name__)
        print(f"[spike2] <- {ev.__class__.__name__}")
    print(f"[spike2] seen: {seen}")
    await model.disconnect()


asyncio.run(main())