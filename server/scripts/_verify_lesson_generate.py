"""验证教师登录后调用 lesson/generate。"""
import httpx

BASE = "http://127.0.0.1:8010"

r = httpx.post(f"{BASE}/api/session/teacher/enter", json={"class_code": "LTZ2024", "teacher_name": "李老师"}, timeout=10)
print("teacher enter:", r.status_code)
if r.status_code != 200:
    print(r.text[:300])
    raise SystemExit
data = r.json()
token = data["session_token"]
print("token:", token[:25], "...")

r = httpx.post(
    f"{BASE}/api/lesson/generate",
    json={"topic": "我的梦想清单", "goals": ["引导每位同学说出一个具体职业理想"], "guidance": "结合本地生活"},
    headers={"X-Auth-Token": token},
    timeout=30,
)
print("lesson/generate X-Auth:", r.status_code, r.text[:200])

r = httpx.post(
    f"{BASE}/api/lesson/generate",
    json={"topic": "我的梦想清单", "goals": ["引导每位同学说出一个具体职业理想"], "guidance": "结合本地生活"},
    headers={"Authorization": f"Bearer {token}"},
    timeout=30,
)
print("lesson/generate Bearer:", r.status_code, r.text[:200])