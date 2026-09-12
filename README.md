# 小信 · Xiaoxin

> 面向乡村小学的 AI 思政谈心伙伴 + 教师备课协作平台
> 「小有可为」比赛作品

小信是一款面向乡村小学思政教育场景的 AI 应用：学生通过**实时语音**与 AI 伙伴谈心，在轻松对话中表达理想；教师端提供班级管理、学情导入、备课生成、书信批改、班级宠物墙等完整教学辅助工具链。

---

## ✨ 核心能力

### 🎙️ 语音谈心（学生端）
- **实时 WebSocket 语音对话**：PCM16 上行 + JSON 事件下行，端到端延迟 P50 < 500ms
- **DashScope Realtime 接入**：基于 AgentScope `RealtimeAgent` + `DashScopeRealtimeModel`，OpenAI-realtime 兼容协议
- **Local 脚本回退**：无模型额度时自动降级为确定性脚本回放，保证演示稳定
- **三种模式**：课堂模式（思政主题引导）、成长日记（日常心情回顾）、备课/复习模式

### 🐾 电子宠物与成长档案
- 每个学生拥有专属三态宠物（日常 daily / 灰色需照料 gray / 鼓舞 cheer）
- 宠物激励学生完成本周小行动，形成"谈心 → 承诺 → 行动 → 宠物成长"闭环
- 成长档案记录理想、教师评语、成绩趋势、最近谈心摘要

### 📚 教师备课协作
- **学情批量导入**：Excel 上传 → AcademicRecord + SubjectScore 结构化存储
- **备课生成**：按班级学情自动拼装教案 materials
- **班级宠物墙**：全班宠物一览，教师可查看整体状态分布
- **学情汇总 API**：带 trend 的分数趋势统计

### 📝 书信系统
- 学生可生成致理想职业的书信（模板填槽）
- 教师可批改、阅读学生书信
- 支持已读/未读状态标记

### 🔑 鉴权体系
- 双 token 类型：学生 `st_` / 教师 `tch_` / 管理员 `ad_`
- **进程内内存会话存储**（已适配 ModelScope 创空间 OSS-FUSE 环境）
- 同时支持 `X-Auth-Token` 和 `Authorization: Bearer` 两种 header

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────┐
│                    browser (React)                    │
│   web-spa / Vite / React Router v6 / TailwindCSS v4  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP + WebSocket
┌──────────────────────▼──────────────────────────────┐
│                FastAPI (Python 3.10+)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │  REST API │ │ WS voice │ │ SPA static fallback   │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
│  routers: session / growth / classroom / lesson /   │
│           letters / points / academic / voice_ws     │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  SQLite (本地 / /mnt/workspace on ModelScope)        │
│  migrations: 0001 ~ 0014                            │
└─────────────────────────────────────────────────────┘

外部服务（可选）：
  · DashScope Realtime (语音) — 基于 AgentScope
  · DashScope API Key (openai>=1.50 兼容)
  · APScheduler (定时任务)
```

### 技术栈

| 层 | 技术 |
|----|------|
| 后端框架 | FastAPI ≥0.111 + Pydantic v2 |
| ASGI 服务器 | uvicorn[standard] ≥0.30 |
| 数据库 | SQLite（14 版本迁移链） |
| 语音 Agent | AgentScope ≥1.0.0 + DashScope Realtime |
| WebSocket | websockets ≥14.0 |
| 定时任务 | APScheduler |
| 前端框架 | React 18.3 + React Router v6 |
| 构建工具 | Vite + TypeScript + TailwindCSS v4 |
| 测试 | pytest (后端) + vitest (前端) |
| MCP | mcp ≥1.13,<2.0 |
| Python | ≥3.10 |

---

## 📁 项目结构

```
xiaoxin_github/
├── server/                 # 后端（FastAPI）
│   ├── app/
│   │   ├── routers/        # 业务路由（11 个模块）
│   │   ├── services/      # 业务逻辑（voice/letter/pet/rag 等）
│   │   ├── schemas/       # Pydantic 模型（API 契约唯一真源）
│   │   ├── db/
│   │   │   └── migrations/ # SQL 迁移 0001 ~ 0014
│   │   ├── main.py        # FastAPI 入口 + SPA fallback
│   │   ├── config.py      # 配置项（pydantic-settings）
│   │   ├── deps.py        # 鉴权依赖（X-Auth-Token + 内存会话）
│   │   └── session_store.py # 进程内会话存储
│   ├── scripts/
│   │   └── seed.py        # 演示数据灌入（首次启动自动执行）
│   ├── tests/             # pytest 测试集
│   └── pyproject.toml     # 后端依赖
├── web-spa/                # 前端（Vite + React）
│   ├── src/
│   │   ├── pages/         # 学生端 + 教师端页面
│   │   ├── stores/        # Zustand 会话存储
│   │   ├── api/client.ts  # 前端 API 客户端（X-Auth-Token）
│   │   └── ws/            # WebSocket 语音客户端
│   └── package.json       # 前端依赖
├── docs/                   # 设计与验收文档
│   ├── acceptance.md          # F5 联调验收报告（22/22 通过）
│   ├── acceptance_matrix.md   # 验收用例矩阵
│   ├── api-changelog.md       # API 契约变更日志（v2.1 冻结）
│   ├── demo-script.md         # 演示谈心脚本
│   ├── rehearsal.md           # 彩排脚本
│   └── 模型接入方案.md        # 模型接入现状与规划
├── Dockerfile              # ModelScope 创空间单容器构建
├── deploy-entrypoint.sh    # 容器启动脚本（seed + uvicorn）
└── .gitignore
```

---

## 🚀 快速开始

### 环境要求
- Python 3.10+
- Node.js 20+
- npm 或 pnpm

### 后端启动

```bash
cd server

# 创建虚拟环境
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# 安装依赖
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple ./

# 灌入演示数据（首次启动时会自动执行 seed.py）
python scripts/seed.py

# 启动服务
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 前端启动

```bash
cd web-spa

npm install
npm run dev           # http://localhost:5173
npm run build          # 构建产物在 dist/
npm run typecheck      # 类型检查
npm run test           # vitest 单测
```

### 环境变量（可选）

```bash
# .env.example
DASHSCOPE_API_KEY=             # DashScope Realtime 语音密钥（留空用 local 脚本）
VOICE_PROVIDER=local           # local | dashscope
VOICE_MODEL=qwen3-omni-flash-realtime
DATABASE_PATH=./demo.db        # SQLite 路径
```

### Docker 部署（ModelScope 创空间）

```bash
# 多阶段构建（Node 构建前端 + Python 后端）
docker build -t xiaoxin .

# 启动（暴露 7860，数据库持久化到 /mnt/workspace）
docker run -p 7860:7860 \
  -e DATABASE_PATH=/mnt/workspace/demo.db \
  -v $(pwd)/data:/mnt/workspace \
  xiaoxin
```

容器启动时 `deploy-entrypoint.sh` 会自动：
1. 确保 `/mnt/workspace` 存在
2. 首次运行时灌入 seed 演示数据
3. 启动 uvicorn 监听 `0.0.0.0:7860`

---

## 🔌 API 契约（v2.1 · 已冻结）

完整列表见 [docs/api-changelog.md](./docs/api-changelog.md)，核心接口如下：

| # | 方法 | 路径 | 描述 |
|---|------|------|------|
| R1 | GET | `/api/classes/{code}` | 获取班级信息与学生列表 |
| R2 | POST | `/api/session/enter` | 学生登录，返回 `st_` token |
| R2-T | POST | `/api/session/teacher/enter` | 教师登录 |
| R3 | GET | `/api/students/{id}/growth` | 学生成长档案 |
| R4 | GET | `/api/students/{id}/pet` | 学生电子宠物状态 |
| R5 | POST | `/api/students/{id}/pet/portrait` | 生成宠物画像 |
| R6 | GET | `/api/jobs/{id}` | 异步任务轮询 |
| R7 | GET | `/api/students/{id}/letters` | 书信列表 |
| R8 | POST | `/api/students/{id}/letters/generate` | 生成书信 |
| R9 | POST | `/api/lesson/generate` | 备课生成 |
| R10 | GET | `/api/lessons/{id}` | 教案详情 |
| R11-13 | POST/GET | `/api/classroom/*` | 班级会话控制 |
| R14 | POST | `/api/classes/{code}/academic` | 学情批量导入 |
| R15 | GET | `/api/classes/{code}/academic` | 学情汇总 |
| R16 | GET | `/api/classes/{code}/lessons` | 班级课程列表 |
| R17 | GET | `/api/classes/{code}/pets` | 班级宠物墙 |
| WS | WS | `/api/ws/voice?token=st_xxx` | 语音 WebSocket |

所有受保护接口在 `X-Auth-Token` header 或 `Authorization: Bearer <token>` 中携带 token。

---

## 🎯 角色与演示入口

| 角色 | 入口 | Token 前缀 | 用途 |
|------|------|-----------|------|
| 学生 | `http://localhost:5173/` 身份页 → 登录 | `st_` | 语音谈心、看宠物、读书信 |
| 教师 | `http://localhost:5173/teacher/entry` | `tch_` | 学情导入、备课、班级管理 |
| 管理员 | 后端 `/api/admin/config` | `ad_` | 系统配置 |

演示班级：**LTZ2024 三（1）班 · 龙头山镇中心小学**，预置 8 名学生。

---

## 📊 验收结果（F5）

> 来源：[docs/acceptance.md](./docs/acceptance.md)

- ✅ 22 / 22 用例通过
- 🎙️ 语音首响 P50：**0.507s**（目标 <2s）
- 🖼️ 生图耗时：**0.01s**
- 📨 信件生成：**0.01s**
- 🔗 关键字段引用：**100%**

---

## 🗂️ 数据库迁移

项目自带 14 版本 SQL 迁移链，位于 `server/app/db/migrations/`：

| 版本 | 描述 |
|------|------|
| 0001 | 基础 schema（students / classes） |
| 0002 | classroom 会话 |
| 0003 | growth 成长档案 |
| 0004 | lesson + academic |
| 0005 | growth_history |
| 0006 | admin 账号 |
| 0007 | teacher_accounts |
| 0008 | academic_background |
| 0009 | teacher_account |
| 0010 | teacher_status |
| 0011 | points 积分系统 |
| 0012 | rag_system |
| 0013 | class_region_detail |
| 0014 | custom_avatar |

应用启动时 `ensure_migrated()` 自动应用未执行的迁移。

---

## 🧪 测试

```bash
# 后端
cd server
pytest tests/ -v              # 全量
pytest tests/f2/test_voice_ws.py  # 语音专项

# 前端
cd web-spa
npm run test                  # vitest
npm run typecheck             # tsc 类型检查
npm run lint                  # ESLint
```

---

## 📚 相关文档

- [F5 联调验收报告](./docs/acceptance.md)
- [验收用例矩阵](./docs/acceptance_matrix.md)
- [API 契约变更日志](./docs/api-changelog.md)
- [演示谈心脚本](./docs/demo-script.md)
- [彩排脚本](./docs/rehearsal.md)
- [模型接入方案](./docs/模型接入方案.md)

---

## ⚠️ 模型接入现状说明

> 来源：[docs/模型接入方案.md](./docs/模型接入方案.md)

当前项目中**唯一真正调用在线模型的是语音对话服务**（DashScope realtime）。书信生成、班宠画像、评分、备课均为**模板/规则实现**，不消耗模型额度：

| 组件 | 模型接入 |
|------|---------|
| 语音对话 | ✅ DashScope Realtime（OpenAI-realtime 兼容） |
| 评分 / 宠物三态 / 结算 | ❌ 纯函数 / 规则（铁律禁 LLM） |
| 书信 | ❌ 模板填槽 |
| 备课 | ❌ 模板拼装 |
| 班宠画像 | ❌ 占位（未实现） |

在 `VOICE_PROVIDER=local` 模式下，**整个系统零模型依赖**，可完全离线演示。

---

## 📜 License

本项目为「小有可为」比赛参赛作品，暂未开源，版权归作者所有。
