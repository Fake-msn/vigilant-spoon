"""Live probe against the ModelScope studio to isolate the session-token asymmetry."""
import json
import requests

BASE = "https://little0hope-xiaoxin.ms.show"

s = requests.Session()

# 1) login student
r = s.post(BASE + "/api/session/enter",
           json={"class_code": "LTZ2024", "student_name": "王小雅"})
print("enter:", r.status_code, r.text[:200])
data = r.json()
tok = data.get("session_token")
print("token:", tok)

# 2) hit protected HTTP endpoint with that token
h = {"Authorization": "Bearer " + (tok or "")}
r2 = s.get(BASE + "/api/classes/LTZ2024/academic", headers=h)
print("academic:", r2.status_code, r2.text[:200])

# 3) hit the class info endpoint (teacher classes) - uses get_current_user
r3 = s.get(BASE + "/api/session/teacher/classes", headers=h)
print("teacher/classes with student token:", r3.status_code, r3.text[:200])

# 4) teacher login flow
r4 = s.post(BASE + "/api/session/teacher/enter",
            json={"class_code": "LTZ2024", "teacher_name": "李老师"})
print("teacher/enter:", r4.status_code, r4.text[:200])
ttok = r4.json().get("session_token")
th = {"Authorization": "Bearer " + (ttok or "")}
r5 = s.get(BASE + "/api/session/teacher/classes", headers=th)
print("teacher/classes:", r5.status_code, r5.text[:250])

# 5) check the /api/health returns fresh
r6 = s.get(BASE + "/api/health")
print("health:", r6.status_code, r6.text[:100])