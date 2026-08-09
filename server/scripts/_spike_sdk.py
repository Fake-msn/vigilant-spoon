"""用官方 dashscope SDK 直接测试，验证大振幅音频能否触发转录。"""
import base64
import math
import os
import struct
import threading
import time

os.environ["DASHSCOPE_API_KEY"] = "sk-ws-H.ERPPPDX.IAPG.MEQCIHE1JBWxxaZNItlxD7kQuk8CIAhZzogeZUL_4Q3YD-7WAiBWbkc32NrqXDpT6pJ_dKLtEA9JPJZs1b2ayub9N6D1eg"
import dashscope
from dashscope.audio.qwen_omni import OmniRealtimeCallback, OmniRealtimeConversation

dashscope.api_key = os.environ["DASHSCOPE_API_KEY"]


def sine_pcm16(seconds, rate=16000, freq=440.0, amp=0.9):
    n = int(seconds * rate)
    frames = bytearray()
    for i in range(n):
        v = amp * math.sin(2 * math.pi * freq * i / rate)
        frames += struct.pack("<h", int(v * 32767))
    return bytes(frames)


class CB(OmniRealtimeCallback):
    def on_event(self, event):
        print("[sdk] on_event:", event.get("type"), str(event)[:150])


def run():
    cb = CB()
    conn = OmniRealtimeConversation(model="qwen3.5-omni-flash-realtime", callback=cb)
    conn.connect()
    time.sleep(1)
    # 发送多频大振幅音频
    audio = bytearray()
    for freq, dur in [(200, 1.0), (300, 1.0), (400, 1.0), (500, 1.0)]:
        audio += sine_pcm16(dur, freq=freq, amp=0.9)
    b64 = base64.b64encode(bytes(audio)).decode()
    print("[sdk] sending audio:", len(audio), "bytes")
    conn.append_audio(b64)
    time.sleep(2)
    conn.commit()
    time.sleep(5)
    conn.close()


run()