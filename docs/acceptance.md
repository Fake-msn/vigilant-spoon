# 小信 F5 联调验收报告
> 生成时间：2026-08-07 16:09:07
> 目标服务：http://localhost:8000

## 总览
- 用例通过：22/22
- 语音首响 P50：0.507s（目标 <2s）
- 生图耗时：0.01s（目标 <10s）
- 信件生成耗时：0.01s
- 关键字段引用：100%

## 用例明细

| ID | 用例 | 结果 | 耗时 | 详情 |
| --- | --- | --- | --- | --- |
| HEALTH | 服务健康检查 | PASS | 2061.17ms |  |
| R1 | GET /classes/{code} | PASS | 7.91ms | students=8 |
| R2-S | POST /session/enter (学生) | PASS | 36.42ms |  |
| R2-T | POST /session/teacher/enter (教师) | PASS | 30.91ms |  |
| R3 | GET /students/{id}/growth | PASS | 8.48ms | stage=sprout, pet_state=daily |
| R4 | GET /students/{id}/pet | PASS | 8.16ms | state=daily |
| R5 | POST /students/{id}/pet/portrait | PASS | 34.66ms | job=portrait-wxy-acceptance-portr |
| R6-P | GET /jobs/{id} 生图轮询 | PASS | 12.48ms | status=done |
| R7 | GET /students/{id}/letters | PASS | 8.04ms | count=4 |
| R8 | POST /students/{id}/letters/generate | PASS | 64.26ms | job=job-letter-2f4949472cdb4683 |
| R6-L | GET /jobs/{id} 信件轮询 | PASS | 8.63ms | status=done |
| R9 | POST /lesson/generate | PASS | 29.35ms | lesson=les-d098dbfd9472 |
| R10 | GET /lessons/{id} | PASS | 15.93ms |  |
| R11 | POST /classes/{code}/session/start | PASS | 14.98ms | state=active |
| R12 | POST /classes/{code}/session/control | PASS | 52.11ms | state=paused |
| R13 | GET /classes/{code}/session/status | PASS | 10.51ms |  |
| R14 | POST /classes/{code}/academic 幂等 | PASS | 41.03ms | count=8/8 |
| R15 | GET /classes/{code}/academic | PASS | 12.99ms | records=8 |
| R16 | GET /classes/{code}/lessons | PASS | 4.61ms | count=6 |
| R17 | GET /classes/{code}/pets | PASS | 4.3ms | count=8, gray_top=True |
| WS-P50 | 语音首响 P50 < 2s | PASS | - | P50=0.507s over 10 probes |
| KEY-FIELDS | 关键字段引用 10 项 | PASS | - | ✓ R1.class_code == LTZ2024; ✓ R1.region_key == yunnan; ✓ R1.students count == 8; ✓ R3.light 无 scores; ✓ R3.pet.state 合法; ✓ R7 存在 is_read; ✓ R7 存在未读; ✓ R15 scores 含 trend; ✓ R17 gray 置顶 |

## 结论
验收通过。

## 附录：F5-04 回滚演练

- 演练时间：2026-08-07
- 操作：在 `web-spa/` 执行 `VITE_USE_MOCK=true npm run build`
- 构建耗时：约 1.68s（目标 <5min）
- 离线包验证：`npx serve -s dist -l 4173` 在无后端情况下返回首页 HTTP 200
- 结论：R0 前端回退与 R3 离线包可用。
