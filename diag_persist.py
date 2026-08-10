# -*- coding: utf-8 -*-
import requests, time
BASE = "https://little0hope-xiaoxin.ms.show"

def reg(name):
    r = requests.post(BASE + "/api/session/teacher/register",
                      json={"name": name, "school": "测试小学"})
    return r.status_code

A = "ZZZ持久A" + str(int(time.time()) % 100000)
B = "ZZZ持久B" + str(int(time.time()) % 100000)
print("A:", A, "B:", B)
print("create A:", reg(A))
print("create B:", reg(B))
print("re-create A (409=still there):", reg(A))
# 再等 20 秒后重查 A
time.sleep(20)
print("re-create A after 20s (409=still there):", reg(A))