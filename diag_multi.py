"""Detect whether the ModelScope studio routes to multiple replicas with separate DBs.

If requests cycle across replicas each holding its OWN copy of /mnt/workspace,
then a write on one replica is invisible to reads on another -> intermittent 401.
"""
import time
import requests

BASE = "https://little0hope-xiaoxin.ms.show"
s = requests.Session()

# 1) Same replica? register a unique teacher then immediately try to login as them.
#    If TEACHER_NOT_REGISTERED appears sometimes -> different replicas.
name = "多副本探测" + str(int(time.time()) % 1000000)
r = s.post(BASE + "/api/session/teacher/register",
           json={"name": name, "school": "测试小学"})
print("register:", r.status_code, r.text[:120])

oks = fails = 0
for i in range(12):
    r = s.post(BASE + "/api/session/teacher/enter",
               json={"class_code": "LTZ2024", "teacher_name": name})
    code = r.json().get("code", r.status_code)
    if r.status_code == 200:
        oks += 1
    else:
        fails += 1
    print(f"  enter#{i}: {r.status_code} code={code}")
    time.sleep(0.3)
print(f"RESULT teacher read-back: ok={oks} fail={fails}")

# 2) student login -> immediately read session, repeated
print("\n-- student session read-back --")
tok_oks = tok_fails = 0
for i in range(10):
    r = s.post(BASE + "/api/session/enter",
               json={"class_code": "LTZ2024", "student_name": "王小雅"})
    tok = r.json().get("session_token", "")
    h = {"Authorization": "Bearer " + tok}
    r2 = s.get(BASE + "/api/classes/LTZ2024/academic", headers=h)
    if r2.status_code == 200:
        tok_oks += 1
    else:
        tok_fails += 1
    print(f"  tok#{i}: {r2.status_code} {r2.text[:60]}")
print(f"RESULT student token: ok={tok_oks} fail={tok_fails}")