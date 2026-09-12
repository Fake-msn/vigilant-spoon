# 小信伙伴 · Xiaoxin

> 面向乡村小学的 AI 思政谈心伙伴 + 教师备课协作平台
> 「小有可为」比赛参赛作品

小信是一款面向乡村小学思政教育场景的 AI 应用：学生通过**实时语音**与 AI 伙伴谈心，在轻松对话中表达理想；教师端提供班级管理、学情导入、备课生成、书信批改、班级宠物墙等完整教学辅助工具链。

**双仓库**
- 🎯 GitHub 主仓库（本页）：`Fake-msn/vigilant-spoon`
- 🎨 Gitee 开发仓库：`xiaoxin_10/a-little-trust`
- 🚀 ModelScope 部署版（deploy-studio 子目录）：`studios/little0hope/xiaoxin`

---

## 🎬 比赛展示

- **展示视频**（双版本 · HyperFrames 合成）
  - 🎞️ 横版 75s（哔哩哔哩）：`video-assets/final/showcase-h/`
  - 📱 竖版 60s（小红书）：`video-assets/final/showcase-v/`
  - 📋 交付说明：[docs/showcase-video/delivery.md](docs/showcase-video/delivery.md)
  - 🎨 分镜表：[docs/showcase-video/storyboard.md](docs/showcase-video/storyboard.md)
  - 🗣️ 术语白话映射：[docs/showcase-video/jargon-map.md](docs/showcase-video/jargon-map.md)
- **小红书笔记预览**：`shanqu-mengxiang-ai/index.html`
- **测试截图**（各端入口/主流程）：`a8-03-screenshots/`

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
- **班宠画像生成**：调用 `POST /api/students/{id}/pet/portrait`，默认生成纯占位 PNG（本地零模型依赖），管理员可开启 DashScope Wanx2.1 文生图输出真实画像（`image_provider=dashscope`）
- 成长档案记录理想、教师评语、成绩趋势、最近谈心摘要

### 📚 教师备课协作
- **学情批量导入**：Excel 上传 → AcademicRecord + SubjectScore 结构化存储
- **备课生成**：按班级学情自动拼装教案 materials（模板拼装，规划中接 LLM）
- **班级宠物墙**：全班宠物一览，教师可查看整体状态分布
- **学情汇总 API**：带 trend 的分数趋势统计

### 📝 书信系统
- 学生可生成致理想职业的书信（优先 LLM 生成，失败回退模板；需关怀学生自动检索 RAG 评语范例）
- 教师可批改、阅读学生书信
- 支持已读/未读状态标记

### 🔑 鉴权体系
- 双 token 类型：学生 `st_` / 教师 `tch_` / 管理员 `ad_`
- **进程内内存会话存储**（已适配 ModelScope 创空间 OSS-FUSE 环境）
- 同时支持 `X-Auth-Token` 和 `Authorization: Bearer` 两种 header（平台网关剥除 Authorization 时自动切换）

### 🎛️ Demo 模式
- 学生端/教师端均内置 DemoModeToggle，便于课堂演示快速切换

---

## 🏰 三条技术护城河

> 来源：`docs/showcase-video/storyboard.md`
> 确保"稳的部分稳、聪明的部分聪明"，不会因为 AI 不稳定影响核心教学场景

1. **规则兜底**（Reliability）
   - 宠物三态机**铁律禁 LLM**（纯函数状态机），结算链只做编排；评分已升级为 LLM 优先 + 关键词兜底
   - 关键数据（梦想、职业、教师评语）100% 确定性，老师看到的永远准确无误
   - 22/22 端到端测试全过，关键字段引用 100%

2. **AI 负责聪明**（Intelligence）
   - 5 条在线模型调用路径已就绪：语音对话（RealtimeAgent）、文本 LLM（书信/评分）、文生图（班宠画像）、RAG embedding（评语检索），全部默认禁用，管理员可在后台或 env 按需打开
   - 备课当前仍是纯模板（规划中接 LLM）；宠物三态机铁律禁 LLM；评分 LLM 优先 + 关键词兜底
   - 默认配置下"零模型依赖"（voice=local, text=template, image=placeholder, embed=disabled），所有组件均有模板/占位/纯规则兜底
   - ModelScope 等平台的算力不稳定时，系统可切到 Local 脚本模式**完全离线运行**

3. **环境自适应**（Portability）
   - SQLite 本地可跑，ModelScope 创空间 OSS-FUSE 挂载通过内存会话存储规避一致性问题
   - 平台网关剥除 `Authorization` header → 自动切换 `X-Auth-Token`
   - agentscope/mcp 版本不兼容 → 语音路由 try/except 防御性加载，核心业务（登录/班级/教师端）不受影响

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
| CI | CircleCI（ruff / mypy / pytest / eslint / tsc / build） |
| Python | ≥3.10 |

---

## 📁 项目结构

```
xiaoxing_github/
├── server/                 # 后端（FastAPI）
│   ├── app/
│   │   ├── routers/        # 业务路由（11 个模块）
│   │   ├── services/      # voice / letter / pet / rag 等
│   │   ├── schemas/       # Pydantic 模型（API 契约唯一真源）
│   │   ├── db/migrations/ # SQL 迁移 0001 ~ 0014
│   │   ├── main.py        # FastAPI 入口 + SPA fallback
│   │   ├── deps.py        # 鉴权（X-Auth-Token + 内存会话）
│   │   └── session_store.py # 进程内会话存储（OOM-FUSE 适配）
│   ├── scripts/seed.py    # 演示数据灌入
│   ├── tests/             # pytest 测试集
│   └── pyproject.toml
├── web-spa/                # 前端（Vite + React）
│   ├── src/pages/         # 学生端 + 教师端页面
│   ├── stores/session.ts  # Zustand 会话
│   ├── api/client.ts      # API 客户端（X-Auth-Token）
│   └── ws/                # WebSocket 语音客户端
├── deploy-studio/          # ModelScope 创空间部署版（独立 Docker 构建）
│   ├── Dockerfile
│   ├── deploy-entrypoint.sh
│   ├── server/             # 与根目录 server 同源，含 session_store.py
│   └── web-spa/            # 与根目录 web-spa 同源
├── docs/                   # 设计与验收文档
│   ├── acceptance.md
│   ├── acceptance_matrix.md
│   ├── api-changelog.md
│   ├── demo-script.md
│   ├── 模型接入方案.md
│   └── showcase-video/     # 展示视频完整交付包
├── video-assets/           # 展示视频成片资产（横版/竖版 MP4 + 配音 WAV）
├── shanqu-mengxiang-ai/   # 小红书笔记单页预览（HTML）
├── a8-03-screenshots/     # 测试截图
├── .circleci/config.yml    # CircleCI 流水线
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

python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -i https://pypi.tuna.tsinghua.edu.cn/simple ./

# 灌入演示数据（首次启动自动执行）
python scripts/seed.py

# 启动
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
DASHSCOPE_API_KEY=             # DashScope Realtime 密钥（留空用 local 脚本）
VOICE_PROVIDER=local           # local | dashscope
VOICE_MODEL=qwen3-omni-flash-realtime
DATABASE_PATH=./demo.db
```

### ModelScope 创空间 Docker 部署

```bash
cd deploy-studio

docker build -t xiaoxin .
docker run -p 7860:7860 \
  -e DATABASE_PATH=/mnt/workspace/demo.db \
  -v $(pwd)/data:/mnt/workspace \
  xiaoxin
```

容器启动脚本 `deploy-entrypoint.sh` 自动：建目录 → 首次 seed → 起 uvicorn（监听 `0.0.0.0:7860`）。

---

## 🔌 API 契约（v2.1 · 已冻结）

完整列表见 [docs/api-changelog.md](docs/api-changelog.md)。核心接口：

| # | 方法 | 路径 | 描述 |
|---|------|------|------|
| R1 | GET | `/api/classes/{code}` | 班级信息 + 学生列表 |
| R2 | POST | `/api/session/enter` | 学生登录 → `st_` token |
| R2-T | POST | `/api/session/teacher/enter` | 教师登录 |
| R3 | GET | `/api/students/{id}/growth` | 成长档案 |
| R4 | GET | `/api/students/{id}/pet` | 电子宠物三态 |
| R5 | POST | `/api/students/{id}/pet/portrait` | 生成宠物画像（placeholder 占位图 / DashScope 文生图） |
| R6 | GET | `/api/jobs/{id}` | 异步任务轮询 |
| R7 | GET | `/api/students/{id}/letters` | 书信列表 |
| R8 | POST | `/api/students/{id}/letters/generate` | 书信生成 |
| R9 | POST | `/api/lesson/generate` | 备课生成 |
| R11-13 | POST/GET | `/api/classroom/*` | 班级会话 start/control/status |
| R14 | POST | `/api/classes/{code}/academic` | 学情批量导入 |
| R15 | GET | `/api/classes/{code}/academic` | 学情汇总 |
| R16 | GET | `/api/classes/{code}/lessons` | 班级课程列表 |
| R17 | GET | `/api/classes/{code}/pets` | 班级宠物墙 |
| WS | WS | `/api/ws/voice?token=st_xxx` | 实时语音 WebSocket |

所有受保护接口从 `X-Auth-Token` 或 `Authorization: Bearer` 取 token。

---

## 🎯 角色与演示入口

| 角色 | 入口 | Token 前缀 | 用途 |
|------|------|-----------|------|
| 学生 | `http://localhost:5173/` 身份页 → 登录 | `st_` | 语音谈心、看宠物、读书信 |
| 教师 | `http://localhost:5173/teacher/entry` | `tch_` | 学情导入、备课、班级管理、多班级切换 |
| 管理员 | 后端 `/api/admin/config` | `ad_` | 系统配置、Demo 快速入口 |

演示班级：**LTZ2024 三（1）班 · 龙头山镇中心小学**，预置 8 名学生。

---

## 📊 验收结果（F5）

> 来源：[docs/acceptance.md](docs/acceptance.md)

- ✅ **22 / 22** 端到端用例通过
- 🎙️ 语音首响 P50：**0.507s**（目标 <2s）
- 🖼️ 生图耗时：**0.01s**
- 📨 信件生成：**0.01s**
- 🔗 关键字段引用：**100%**

---

## 🗂️ 数据库迁移

14 版本 SQL 迁移链，`ensure_migrated()` 启动时自动应用：

| # | 描述 |
|---|------|
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

---

## 🛠️ CI

`.circleci/config.yml` 自动在每次推送时跑：
- 后端：ruff / mypy / pytest
- 前端：eslint / tsc typecheck / vitest / vite build

---

## 🐛 关键修复历史

从 Gitee 合并 commit（`47f583c Merge branch 'feat-develop-web-folder-c1Z7mf' into master`）以来的重要修复：

| Commit | 描述 |
|--------|------|
| `dbdcd1a` | **平台网关剥除 Authorization header → 改用 `X-Auth-Token`**，修复魔塔创空间 401 循环 |
| `0f1a8ee` | **内存会话存储 `session_store.py`**，规避 OSS-FUSE 写后读不一致导致登录后查不到 token |
| `0f1a8ee` | **SPA 前端单容器托管**，FastAPI 同时托管 Vite dist + API |
| `0f1a8ee` | **agentscope 依赖纳入 Dockerfile**，先装 hatchling 再 `--no-build-isolation`，确保 voice_ws 可加载 |
| `8b9c85a` | **防御性加载 voice_ws**（try/except），agentscope/mcp 版本不兼容时核心业务不受影响 |
| `3a75645` | 教师登录不再强制输入班级码，支持姓名+密码直登 |
| `a3773c2` | 班级码大小写适配，统一输入层 + API 层归一化大写 |
| `cfbba2b` | 教师班级切换跳过重输班级码（presetClass via route state） |
| `af20aad` | DemoModeToggle 教师端入口页面 |
| `7571bbf` | 管理员登录 Demo 快速入口 + 右上角 toggle |

---

## 🧪 测试

```bash
# 后端
cd server
pytest tests/ -v

# 前端
cd web-spa
npm run test          # vitest
npm run typecheck     # tsc
npm run lint          # ESLint
```

---

## 📚 相关文档

| 文档 | 位置 |
|------|------|
| F5 联调验收报告 | [docs/acceptance.md](docs/acceptance.md) |
| 验收用例矩阵 | [docs/acceptance_matrix.md](docs/acceptance_matrix.md) |
| API 契约变更日志 | [docs/api-changelog.md](docs/api-changelog.md) |
| 演示谈心脚本 | [docs/demo-script.md](docs/demo-script.md) |
| 彩排脚本 | [docs/rehearsal.md](docs/rehearsal.md) |
| 模型接入方案 | [docs/模型接入方案.md](docs/模型接入方案.md) |
| 展示视频交付 | [docs/showcase-video/delivery.md](docs/showcase-video/delivery.md) |
| 展示视频分镜 | [docs/showcase-video/storyboard.md](docs/showcase-video/storyboard.md) |
| 术语白话映射 | [docs/showcase-video/jargon-map.md](docs/showcase-video/jargon-map.md) |

---

## ⚠️ 模型接入现状

> **事实核查**（基于 commit 47f583c + 956e3c5 feat: 模型接入方案 5.1-5.3）：下表是代码真实实现。旧版 docs/模型接入方案.md（956e3c5 之前）中的"班宠画像未实现 / 书信纯模板 / RAG 不存在"等描述已**全部过时**。

### 代码已实现的 5 条在线模型调用路径

| # | 组件 | Service | 模型类型 | Provider 枚举 | 默认 | 兜底策略 |
|---|------|---------|---------|--------------|------|---------|
| 1 | 语音对话 | services/voice.py | DashScope Realtime（AgentScope RealtimeAgent） | local / dashscope | local | Local 脚本回放 |
| 2 | 文本 LLM | services/llm.py | DashScope qwen-plus / OpenAI 兼容 | template / dashscope / openai | template | 返回 None，调用方回模板 |
| 3 | 文生图 | services/imagegen.py | DashScope Wanx2.1 文生图 | placeholder / dashscope | placeholder | 本地生成纯占位 PNG |
| 4 | RAG Embedding | services/rag.py | DashScope text-embedding-v3 | disabled / dashscope | disabled | add_document no-op，search 返回空 |
| 5 | 管理员后台 | routers/admin.py | 运行时覆盖以上 provider | service_config DB 表 | Settings 默认 | 未写 DB 时用 Settings |

### 各业务组件实际模型行为

| 组件 | 模型策略 | 代码事实 |
|------|---------|---------|
| 语音对话 | **唯一默认启用在线模型**（voice=local 回脚本） | AgentScope RealtimeAgent + DashScopeRealtimeModel 完整实现 |
| 书信生成 | **LLM 优先 + 模板兜底**；需关怀学生自动调 RAG | letter.py::generate_letter() 先 _generate_with_llm() 再 chat_completion()，失败回模板 |
| 评分 | **LLM 优先 + 关键词兜底** | scoring.py::score_transcript() 先 _score_with_llm()，失败回确定性关键词打分 |
| 备课 | 模板拼装（**不调 LLM**） | 规划中接 LLM，当前代码纯模板 |
| 班宠画像 | placeholder 占位图 / dashscope 真实文生图 | imagegen.py 完整实现 submit 轮询 下载落盘；growth.py::create_portrait() 真实调用 |
| 宠物三态机 | **铁律禁 LLM，纯函数状态机** | 不调任何模型 |
| 结算链 | 纯编排（调用 pet + scoring） | 评分可走 LLM，但 pet 铁律禁 LLM |

### 管理员后台动态配置

runtime_config.py 提供 "Settings 默认值 → DB service_config 表覆盖" 两级优先级。管理员可通过 POST /api/admin/config 在运行时切换 provider、填 API key，无需重启：

开启 DashScope 语音 + 文本 LLM + 文生图：
POST /api/admin/config
{ voice_provider: dashscope, dashscope_api_key: sk-xxx, text_provider: dashscope, text_api_key: sk-xxx, image_provider: dashscope, image_api_key: sk-xxx }

### 演示铁律（永不崩）

所有 5 条模型路径均有**双保险兜底**：

1. Provider 未配置（template / placeholder / disabled / local）→ 直接跳过在线调用
2. Provider 已配置但 key 缺失 / 网络异常 / LLM 输出解析失败 → 返回 None / 回模板 / 回占位图

默认配置下**全系统零模型依赖**，可完全离线演示。

---

## 📜 License

本项目为「小有可为」比赛参赛作品，暂未开源，版权归作者所有。
