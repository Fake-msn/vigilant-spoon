"""Test whether session tokens become valid after a delay (OSS-FUSE propagation lag)."""
import time
import requests

BASE = "https://little0hope-xiaoxin.ms.show"
s = requests.Session()

# login, then wait increasing delays before using the token
for delay in [0, 1, 3, 6]:
    r = s.post(BASE + "/api/session/enter",
               json={"class_code": "LTZ2024", "student_name": "王小雅"})
    tok = r.json().get("session_token", "")
    print(f"login: {r.status_code}")
    time.sleep(delay)
    h = {"Authorization": "Bearer " + tok}
    r2 = s.get(BASE + "/api/classes/LTZ2024/academic", headers=h)
    print(f"  after {delay}s delay -> academic: {r2.status_code} {r2.text[:60]}")

# Now test teacher session with delay
print("\n-- teacher --")
for delay in [0, 5]:
    r = s.post(BASE + "/api/session/teacher/enter",
               json={"class_code": "LTZ2024", "teacher_name": "李老师"})
    tok = r.json().get("session_token", "")
    print(f"teacher login: {r.status_code}")
    time.sleep(delay)
    r2 = s.get(BASE + "/api/session/teacher/classes",
               headers={"Authorization": "Bearer " + tok})
    print(f"  after {delay}s delay -> classes: {r2.status_code} {r2.text[:60]}")