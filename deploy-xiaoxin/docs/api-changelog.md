# 小信 API 契约变更日志

> 唯一真源：后端 `server/app/schemas/`（pydantic）
> 变更流程：改 pydantic → 同步本文档 → 前端 `npm run gen:types` → 双端测试

## v2.1 — 2026-08-06（冻结基线）

由《迁移计划 v3.0》与《接口验证调试核对清单 v1.0》共同定案，取代 v2.0 全部契约假设。

### 关键修订

| # | 修订项 | v2.0 | v2.1 |
|---|--------|------|------|
| A1 | PetState 模型 | `mood` + `vitality` | 三态 `state: daily\|gray\|cheer`；新增 `last_growth_at` / `cheer_until` / `needs_care` / `portrait_url`；弃用 `mood`/`vitality` |
| A2 | StudentProfile | 无校内角色 | 新增 `role: member\|group_leader\|class_committee\|subject_rep` |
| A3 | 学情档案 | 缺失 | 新增 R14 导入 / R15 汇总 + `AcademicRecord`/`SubjectScore` |
| A4 | 课程列表 | R10 仅单查 | 新增 R16 `GET /api/classes/{code}/lessons` |
| A5 | 班级宠物墙 | R4 仅单学生 | 新增 R17 `GET /api/classes/{code}/pets`（禁评分） |
| A6 | Letter | 无已读标记 | 新增 `is_read: bool` |
| A7 | WS 下行事件 | 无 `vad_end` | 补 `vad_start` / `vad_end` / `session_end` |
| A8 | session_token | 未定义 | `st_` opaque token，12h，无刷新，sessionStorage |
| A9 | 错误 envelope | 未定义 | 统一 `{code, message, details}` |
| A10 | needs_care 触发 | vitality 下行 | 进入 `gray` 态时置位 |

### 接口清单（R1-R17）

- R1 `GET /api/classes/{class_code}` → ClassInfo
- R2 `POST /api/session/enter` → EnterResp
- R3 `GET /api/students/{id}/growth?view=full|light` → GrowthView
- R4 `GET /api/students/{id}/pet` → PetState
- R5 `POST /api/students/{id}/pet/portrait` → JobRef
- R6 `GET /api/jobs/{job_id}` → JobStatus
- R7 `GET /api/students/{id}/letters` → Letter[]
- R8 `POST /api/students/{id}/letters/generate` → JobRef
- R9 `POST /api/lesson/generate` → LessonPlan
- R10 `GET /api/lessons/{id}` → LessonPlan
- R11 `POST /api/classroom/start` → ClassroomStatus
- R12 `POST /api/classroom/control` → ClassroomStatus
- R13 `GET /api/classroom/status` → ClassroomStatus
- R14 `POST /api/classes/{code}/academic` → AcademicRecord[]
- R15 `GET /api/classes/{code}/academic` → AcademicSummary
- R16 `GET /api/classes/{code}/lessons` → LessonSummary[]
- R17 `GET /api/classes/{code}/pets` → ClassPetView[]

### 状态

- **状态**：已冻结
- **变更纪律**：此后任何契约变更必须同步修订本文档，并重新执行 gen:types + 双端测试。
