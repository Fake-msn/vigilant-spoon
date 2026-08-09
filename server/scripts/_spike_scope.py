"""隔离测试：直接 RealtimeAgent + DashScopeRealtimeModel 发送真实音频，验证 VAD 是否触发。"""
import asyncio
import json
import math
import struct

from agentscope.agent import RealtimeAgent
from agentscope.realtime import ClientEvents, DashScopeRealtimeModel

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
    agent = RealtimeAgent(name="test", sys_prompt="你是测试助手", model=model)
    out = asyncio.Queue()
    await agent.start(out)

    print("[spike] agent started, sending audio...")
    b64 = __import__("base64").b64encode(sine_pcm16(2.0)).decode()
    await agent.handle_input(ClientEvents.ClientAudioAppendEvent(
        session_id="t", audio=b64, format={"type": "audio/pcm", "rate": 16000},
    ))
    await asyncio.sleep(0.5)
    await agent.handle_input(ClientEvents.ClientAudioCommitEvent(session_id="t"))

    seen = []
    for _ in range(40):
        try:
            ev = await asyncio.wait_for(out.get(), timeout=5)
        except asyncio.TimeoutError:
            print("[spike] (timeout)")
            break
        seen.append(ev.__class__.__name__)
        print(f"[spike] <- {ev.__class__.__name__}")
        if ev.__class__.__name__ == "AgentEndedEvent":
            break
    print(f"[spike] seen: {seen}")
    await agent.stop()


asyncio.run(main())