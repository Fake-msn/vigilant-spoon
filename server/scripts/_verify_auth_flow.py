"""验证学生登录后 X-Auth-Token 访问受保护接口。"""
import httpx

BASE = "http://127.0.0.1:8010"

# 1. 学生登录
r = httpx.post(f"{BASE}/api/session/enter", json={"class_code": "LTZ2024", "student_name": "王小雅"}, timeout=10)
print("login status:", r.status_code)
if r.status_code != 200:
    print(r.text[:200])
    raise SystemExit
data = r.json()
token = data["session_token"]
sid = data["profile"]["id"]
print("token:", token[:20], "...")

# 2. 用 X-Auth-Token 访问学生 growth
r = httpx.get(f"{BASE}/api/students/{sid}/growth", headers={"X-Auth-Token": token}, timeout=10)
print("growth X-Auth:", r.status_code, r.text[:80])

# 3. 用 Authorization Bearer 访问（fallback）
r = httpx.get(f"{BASE}/api/students/{sid}/growth", headers={"Authorization": f"Bearer {token}"}, timeout=10)
print("growth Bearer:", r.status_code, r.text[:80])

# 4. 无 token
r = httpx.get(f"{BASE}/api/students/{sid}/growth", timeout=10)
print("growth no auth:", r.status_code, r.text[:80])