# 小信 F5 双线彩排报告
> 生成时间：2026-08-07 16:11:26
> 目标服务：http://localhost:8000

## 总览
- 步骤通过：20/20
- 学生线步骤：9
- 教师线步骤：11

## 彩排明细

| 线路 | 步骤 | 结果 | 耗时 | 详情 |
| --- | --- | --- | --- | --- |
| 学生线 | 登录（王小雅） | PASS | 2124.01ms |  |
| 学生线 | 查看班级信息 | PASS | 6.11ms | students=8 |
| 学生线 | 成长档案（确定性字段） | PASS | 8.46ms | ideal=蛋糕师, commitments=2, actions=1 |
| 学生线 | 查看电子宠物 | PASS | 5.75ms | state=daily |
| 学生线 | 查看信箱 | PASS | 6.26ms | letters=4 |
| 学生线 | 触发本周来信 | PASS | 65.7ms | job=job-letter-bae9e832ded643b2 |
| 学生线 | 信件生成完成 | PASS | - | status=done |
| 学生线 | 生成梦想画像 | PASS | 26.8ms | job=portrait-wxy-rehearsal-portra |
| 学生线 | 画像生成完成 | PASS | - | status=done |
| 教师线 | 登录（李老师） | PASS | 30.82ms |  |
| 教师线 | 班级宠物墙 | PASS | 7.83ms | count=8, gray_top=True |
| 教师线 | 学情汇总 | PASS | 10.63ms | records=8 |
| 教师线 | 学情导入 | PASS | 29.33ms |  |
| 教师线 | 我的课程 | PASS | 8.2ms | count=8 |
| 教师线 | 生成备课方案 | PASS | 32.65ms | lesson=les-64f004a30127 |
| 教师线 | 查看备课方案 | PASS | 8.47ms |  |
| 教师线 | 启动课堂 | PASS | 5.67ms | state=active |
| 教师线 | 暂停课堂 | PASS | 32.02ms | state=paused |
| 教师线 | 确认课堂状态 | PASS | 7.72ms | state=paused |
| 教师线 | 恢复课堂 | PASS | - |  |

## 结论
彩排无阻断。
