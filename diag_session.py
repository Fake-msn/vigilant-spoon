# -*- coding: utf-8 -*-
import requests
BASE = "https://little0hope-xiaoxin.ms.show"

def login(s):
    r = s.post(BASE + "/api/session/enter", json={"class_code": "LTZ2024", "student_name": "王小雅"})
    return r.json().get("session_token")

def check(s, tok, label):
    h = {"Authorization": "Bearer " + tok}
    r = s.get(BASE + "/api/classes/LTZ2024/academic", headers=h)
    print(f"{label}: {r.status_code} {r.text[:80]}")

s1 = requests.Session()
tok = login(s1)
print("token:", tok)
for i in range(5):
    check(s1, tok, f"same-session#{i}")

s2 = requests.Session()
check(s2, tok, "new-session")

s3 = requests.Session()
tok2 = login(s3)
check(s3, tok2, "new-login-same-session")