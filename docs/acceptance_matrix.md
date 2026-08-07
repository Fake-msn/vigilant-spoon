# 小信 F5 联调矩阵报告
> 生成时间：2026-08-07 16:09:26
> 目标服务：http://localhost:8000

## 总览
- 用例通过：70/70
- 接口数：17
- 矩阵空格：0

## 矩阵明细

| ID | 场景 | 期望 | 实际 | 结果 | 耗时 |
| --- | --- | --- | --- | --- | --- |
| R1-正常 | GET /classes/{code} 正常 | 200 | 200 | PASS | 5.85ms |
| R1-404 | GET /classes/{code} 班级不存在 | 404 | 404 | PASS | 3.47ms |
| R1-幂等 | GET /classes/{code} 幂等 | 200 | 200 | PASS | 5.25ms |
| R2-S-正常 | POST /session/enter 学生正常 | 200 | 200 | PASS | 28.89ms |
| R2-S-参数错 | POST /session/enter 缺姓名 | 422 | 422 | PASS | 2.6ms |
| R2-S-404 | POST /session/enter 学生不存在 | 404 | 404 | PASS | 6.19ms |
| R2-S-幂等 | POST /session/enter 重复进入仍 200 | 200 | 200 | PASS | 33.59ms |
| R2-T-正常 | POST /session/teacher/enter 教师正常 | 200 | 200 | PASS | 31.5ms |
| R2-T-参数错 | POST /session/teacher/enter 缺班级码 | 422 | 422 | PASS | 2.25ms |
| R2-T-404 | POST /session/teacher/enter 班级不存在 | 404 | 404 | PASS | 5.45ms |
| R2-T-未认证 | POST /session/teacher/enter 无需 token（N/A） | 200 | 200 | PASS | 36.94ms |
| R3-正常 | GET /students/{id}/growth 正常 | 200 | 200 | PASS | 12.07ms |
| R3-未认证 | GET /students/{id}/growth 无 token | 401 | 401 | PASS | 3.77ms |
| R3-404 | GET /students/{id}/growth 学生不存在 | 404 | 404 | PASS | 10.49ms |
| R3-幂等 | GET /students/{id}/growth 幂等 | 200 | 200 | PASS | 10.79ms |
| R4-正常 | GET /students/{id}/pet 正常 | 200 | 200 | PASS | 7.9ms |
| R4-未认证 | GET /students/{id}/pet 无 token | 401 | 401 | PASS | 3.13ms |
| R4-404 | GET /students/{id}/pet 学生不存在 | 404 | 404 | PASS | 5.29ms |
| R4-幂等 | GET /students/{id}/pet 幂等 | 200 | 200 | PASS | 7.76ms |
| R5-正常 | POST /students/{id}/pet/portrait 正常 | 200 | 200 | PASS | 44.57ms |
| R5-幂等 | POST /students/{id}/pet/portrait 同 key 同 job | 200 | 200 | PASS | 7.93ms |
| R5-未认证 | POST /students/{id}/pet/portrait 无 token | 401 | 401 | PASS | 3.12ms |
| R5-404 | POST /students/{id}/pet/portrait 学生不存在 | 404 | 404 | PASS | 6.03ms |
| R6-正常 | GET /jobs/{id} 正常 | 200 | 200 | PASS | 6.06ms |
| R6-未认证 | GET /jobs/{id} 无 token | 401 | 401 | PASS | 3.22ms |
| R6-404 | GET /jobs/{id} 任务不存在 | 404 | 404 | PASS | 5.96ms |
| R6-幂等 | GET /jobs/{id} 幂等 | 200 | 200 | PASS | 4.01ms |
| R7-正常 | GET /students/{id}/letters 正常 | 200 | 200 | PASS | 6.13ms |
| R7-未认证 | GET /students/{id}/letters 无 token | 401 | 401 | PASS | 4.16ms |
| R7-404 | GET /students/{id}/letters 学生不存在 | 404 | 404 | PASS | 6.67ms |
| R7-幂等 | GET /students/{id}/letters 幂等 | 200 | 200 | PASS | 7.84ms |
| R8-正常 | POST /students/{id}/letters/generate 正常 | 200 | 200 | PASS | 63.02ms |
| R8-幂等 | POST /students/{id}/letters/generate 同 key 同 job | 200 | 200 | PASS | 15.35ms |
| R8-未认证 | POST /students/{id}/letters/generate 无 token | 401 | 401 | PASS | 4.53ms |
| R8-404 | POST /students/{id}/letters/generate 学生不存在 | 404 | 404 | PASS | 8.15ms |
| R9-正常 | POST /lesson/generate 正常 | 200 | 200 | PASS | 44.51ms |
| R9-参数错 | POST /lesson/generate 缺 topic | 422 | 422 | PASS | 9.14ms |
| R9-未认证 | POST /lesson/generate 无 token | 401 | 401 | PASS | 4.19ms |
| R10-404 | GET /lessons/{id} 课程不存在 | 404 | 404 | PASS | 10.85ms |
| R10-未认证 | GET /lessons/{id} 无 token | 401 | 401 | PASS | 3.73ms |
| R11-正常 | POST /classes/{code}/session/start 正常 | 200 | 200 | PASS | 7.11ms |
| R11-未认证 | POST /classes/{code}/session/start 无 token | 401 | 401 | PASS | 3.19ms |
| R11-404 | POST /classes/{code}/session/start 班级不存在 | 404 | 404 | PASS | 5.1ms |
| R11-幂等 | POST /classes/{code}/session/start 重复 start 返回当前状态 | 200 | 200 | PASS | 8.53ms |
| R12-正常 | POST /classes/{code}/session/control pause | 200 | 200 | PASS | 33.25ms |
| R12-409 | POST /classes/{code}/session/control 状态冲突 | 409 | 409 | PASS | 7.98ms |
| R12-参数错 | POST /classes/{code}/session/control 非法 action | 422 | 422 | PASS | 3.61ms |
| R12-幂等 | POST /classes/{code}/session/control 同 cmd_id 幂等 | 200 | 200 | PASS | 7.22ms |
| R12-未认证 | POST /classes/{code}/session/control 无 token | 401 | 401 | PASS | 1.87ms |
| R13-正常 | GET /classes/{code}/session/status 正常 | 200 | 200 | PASS | 4.23ms |
| R13-未认证 | GET /classes/{code}/session/status 无 token | 401 | 401 | PASS | 2.71ms |
| R13-404 | GET /classes/{code}/session/status 班级不存在 | 404 | 404 | PASS | 4.35ms |
| R13-幂等 | GET /classes/{code}/session/status 幂等 | 200 | 200 | PASS | 7.19ms |
| R14-正常 | POST /classes/{code}/academic 正常 JSON | 200 | 200 | PASS | 32.26ms |
| R14-参数错 | POST /classes/{code}/academic 记录格式错误 | 422 | 422 | PASS | 9.67ms |
| R14-404 | POST /classes/{code}/academic 班级不存在 | 404 | 404 | PASS | 8.36ms |
| R14-幂等 | POST /classes/{code}/academic 重复导入人数不变 | 200 | 200 | PASS | 43.89ms |
| R14-未认证 | POST /classes/{code}/academic 无 token | 401 | 401 | PASS | 2.83ms |
| R15-正常 | GET /classes/{code}/academic 正常 | 200 | 200 | PASS | 9.32ms |
| R15-未认证 | GET /classes/{code}/academic 无 token | 401 | 401 | PASS | 4.01ms |
| R15-404 | GET /classes/{code}/academic 班级不存在 | 404 | 404 | PASS | 5.17ms |
| R15-幂等 | GET /classes/{code}/academic 幂等 | 200 | 200 | PASS | 10.69ms |
| R16-正常 | GET /classes/{code}/lessons 正常 | 200 | 200 | PASS | 5.74ms |
| R16-未认证 | GET /classes/{code}/lessons 无 token | 401 | 401 | PASS | 2.13ms |
| R16-404 | GET /classes/{code}/lessons 班级不存在 | 404 | 404 | PASS | 4.23ms |
| R16-幂等 | GET /classes/{code}/lessons 幂等 | 200 | 200 | PASS | 6.28ms |
| R17-正常 | GET /classes/{code}/pets 正常 | 200 | 200 | PASS | 5.65ms |
| R17-未认证 | GET /classes/{code}/pets 无 token | 401 | 401 | PASS | 2.31ms |
| R17-404 | GET /classes/{code}/pets 班级不存在 | 404 | 404 | PASS | 4.5ms |
| R17-幂等 | GET /classes/{code}/pets 幂等 | 200 | 200 | PASS | 4.58ms |

## 结论
矩阵通过。
