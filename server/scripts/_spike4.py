import base64, math, struct

def sine_pcm16(seconds, rate=16000, freq=440.0, amp=0.5):
    n = int(seconds * rate)
    frames = bytearray()
    for i in range(n):
        v = amp * math.sin(2 * math.pi * freq * i / rate)
        frames += struct.pack("<h", int(v * 32767))
    return bytes(frames)

audio = sine_pcm16(2.0)
b64 = base64.b64encode(audio).decode()
print("raw bytes:", len(audio))
print("b64 len:", len(b64))
print("b64 head:", b64[:40])
# 解码回测试
print("decoded len:", len(base64.b64decode(b64)))
print("first 8 samples:", audio[:16].hex())