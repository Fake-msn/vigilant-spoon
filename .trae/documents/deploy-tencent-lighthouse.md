# 小信项目部署到腾讯云轻量服务器（Ubuntu 24.04 Docker）方案

## Summary（概述）

把「小信」项目（**GitHub `lxyh-99/xiaoxin` master 分支**）以**单容器**方式部署到腾讯云轻量应用服务器
`139.155.132.128`（Ubuntu 24.04 + Docker 镜像），并通过**域名 HTTPS** 对外提供访问。

架构：**一个 FastAPI 容器** 同时托管「Vite 构建的 web-spa 前端静态产物 + 全部 `/api/*` 接口 + WebSocket 语音 `/api/ws/voice`」，
前置一个 HTTPS 反向代理（推荐 Caddy，自动签发 Let's Encrypt 证书）。SQLite 数据库挂载持久化卷保存数据。

已确认的三个关键决策：
1. 部署 **GitHub master 最新版**（含管理员后台 / 积分 / RAG / 教师账号注册审核）。
2. 用**域名 + HTTPS** 访问（语音/麦克风 getUserMedia 需要安全上下文）。
3. **接入真实 DashScope** AI 服务（语音实时 / 文本 LLM / 文生图 / RAG embedding）。

---

## Current State Analysis（现状分析）

### 代码侧（已探索确认）
- **单进程同源架构**：前端 `web-spa` 通过 Vite 构建为静态文件，生产环境由 FastAPI 进程统一托管，客户端用相对前缀 `/api` 请求接口，无跨域问题。
- **WebSocket**：`web-spa/src/ws/voice.ts` 用 `window.location.protocol` 自动拼 `wss://host/api/ws/voice?token=...`，HTTPS 下自动走 wss，反代需**透传 WebSocket 升级**。
- **鉴权**：DB 内不透明 token（`st_`/`ad_`），不存在签名密钥不一致问题。
- **配置注入**：`server/app/config.py` 用 pydantic-settings，下列项可直接用环境变量覆盖：
  - `DATABASE_PATH`（SQLite 路径）
  - `ADMIN_PASSWORD`（管理员后台密码，默认 `admin123`）
  - `DASHSCOPE_API_KEY`、`VOICE_PROVIDER`、`TEXT_PROVIDER`、`TEXT_BASE_URL`、`TEXT_API_KEY`、`IMAGE_PROVIDER`、`IMAGE_API_KEY`、`EMBED_PROVIDER`、`EMBED_API_KEY` 等
  - 且管理员后台 `PUT /admin/config` 可把配置写入 DB（`runtime_config.py`：DB > env）。
- **演示数据**：`server/scripts/seed.py` 幂等灌入 1 班级（LTZ2024）+8 学生 +教师「李老师」（无密码，默认 active）+ 积分规则。

### 与本地 deploy-studio 的差异（部署前需补齐）
- **GitHub master 仓库缺少**：`Dockerfile`、`deploy-entrypoint.sh`、`docker-compose.yml`。
- **GitHub master 的 `main.py` 缺少 SPA 静态托管兜底**（本地 `deploy-studio/server/app/main.py` 已有 `spa_fallback`，可移植）。

### 服务器侧（腾讯云合规要点）
- 国内轻量服务器用 **80/443 对外服务要求域名 ICP 备案**，否则端口/域名被拦截——**潜在阻塞项，需确认**。
- 轻量云「防火墙/安全组」需放行 80/443（或自定义端口）。

---

## Proposed Changes（实施改动）

部署分为「代码侧补齐」与「服务器侧部署」两部分。**代码改动最小化，移植现有成例。**

### A. 代码侧（在仓库顶部新增/修改下列文件）
1. **`Dockerfile`**（新增，多阶段构建）
   - Stage 1：`node:20-slim`，`npm ci` + `npm run build` 构建 `web-spa` → `/build/dist`。
   - Stage 2：`python:3.12-slim`，`pip install ./server`，拷贝前端产物到 `/app/webspa-dist`，
     `ENV SPA_DIST_DIR=/app/webspa-dist`，`EXPOSE 8000`，`CMD ["/app/deploy-entrypoint.sh"]`。
2. **`deploy-entrypoint.sh`**（新增）
   - 确保数据目录存在；**仅当数据库文件不存在时**执行 `seed.py`（避免每次启动清库、丢失教师注册/数据）。
   - `exec uvicorn app.main:app --host 0.0.0.0 --port 8000`。
3. **`docker-compose.yml`**（新增）
   - 服务 `app`：build 上下文为仓库根，映射 `8000:8000`，挂载命名卷 `data:/data`，
     `DATABASE_PATH=/data/demo.db` 环境变量。
   - 服务 `caddy`：`caddy:2`，映射 `80:80`、`443:443`、`443/udp`，挂载 `Caddyfile` 与数据卷。
4. **`Caddyfile`**（新增）
   - `你的域名 { reverse_proxy app:8000 }`，Caddy 自动申请/续期 TLS，并透传 WebSocket 升级。
5. **`server/app/main.py`**（修改，补 SPA 静态托管）
   - 移植 deploy-studio 的 `spa_fallback` 路由（`/{full_path:path}` 兜底返回 `index.html`，`/api/*` 未命中按 404）。

### B. 服务器侧部署步骤（获得所需信息后执行）
1. SSH 登录服务器，确认 `docker` / `docker compose` 可用。
2. 将代码上传（方式见「决策」）到服务器目录，如 `/opt/xiaoxin`。
3. 配置 `.env`（含 DashScope key、admin 密码）。
4. `docker compose up -d --build`。
5. 验证：`https://域名/api/health`、学生/教师登录、语音 wss 连通。

---

## Assumptions & Decisions（假设与决策）

- **部署来源**：以 GitHub master 为准，代码改动直接提交/同步到该仓库，再部署。
- **反向代理**：默认用 **Caddy**（自动 HTTPS、内置 WebSocket 透传、配置简单）；若你更倾向 Nginx+certbot 可替换，但需手动配置 wss。
- **端口**：容器内 app 用 `8000`，对外由 Caddy 暴露 `80/443`。
- **数据持久化**：SQLite 挂载 Docker 命名卷，**首次启动才 seed**，之后保留数据。
- **教师账号**：先用 seed 的演示「李老师」（无密码，active）；教师注册+管理员审核流程为正式使用预留。
- **合规**：默认按「域名已 ICP 备案」推进；若未备案，需改走「IP + 自定义端口（如 8443）+ 自签证书」降级方案（语音功能受限）。

---

## Verification（验收）

1. `docker compose up -d --build` 成功，容器 `app` / `caddy` 均 healthy。
2. `https://域名/api/health` 返回 `{"status":"ok"}`。
3. 学生端：班级码 `LTZ2024` + 某学生姓名可进入；成长/学情/课程页可访问。
4. 教师端：`我是老师` → 输入 `李老师` 登录成功，教师控制台可进。
5. 管理员端：`/api/admin/login` 用 `ADMIN_PASSWORD` 能拿到 `ad_` token，后台配置可读写。
6. 语音：浏览器（HTTPS 安全上下文）能打开麦克风，`wss://域名/api/ws/voice` 会话建立，收到 `session_started` 事件。
7. 数据持久：重启容器后教师会话/数据仍在（非首启不重新 seed）。

---

## 需要你提供的辅助信息（Checklist）

> 这是本次部署的**核心交付物**——请逐项补齐，缺项将阻塞对应环节。

### 1. 服务器访问（必填）
- SSH 登录方式：**用户名 + 密码** 或 **SSH 私钥**（Lighthouse 默认用户常为 `ubuntu` / `lighthouse` / `root`）。
- 是否允许我**直接通过 SSH 在服务器上执行部署命令**（需 139.155.132.128:22 从我所在环境可达）；若不能，则由你复制命令手动执行。
- 服务器规格：CPU / 内存 / 系统盘（判断资源是否充足，本项目较轻量，一般 2 核 2G 即可）。

### 2. 域名与 HTTPS（必填，涉语音）
- **域名**是什么，是否已解析一条 **A 记录 → 139.155.132.128**。
- **域名是否已完成 ICP 备案**（腾讯云国内服务器 80/443 对外服务硬性要求，未备案会拦截）。
- 若域名未备案，是否接受「IP + 自定义端口 + 自签证书」的降级方案（语音功能受限）。

### 3. 腾讯云控制台操作（你需在控制台完成）
- 轻量服务器「**防火墙**」放行 TCP `80`、`443`（Caddy 用）。
- 确认该实例的 Docker / Docker Compose 已就绪（预装 Docker 镜像一般自带）。

### 4. AI 服务凭据（接入真实 DashScope 必填）
- **DashScope API Key**（阿里云百炼）。可共用一把，覆盖语音实时 / 文本 LLM / 文生图 / embedding；
  若分域，请分别给出或说明。
- 确认要启用的模型默认值是否够用（语音 `qwen3.5-omni-flash-realtime`、文本 `qwen-plus`、文生图 `wanx2.1-t2i-turbo`、embedding `text-embedding-v3`）。

### 5. 安全凭据（必填）
- 管理员后台密码 `ADMIN_PASSWORD`（默认 `admin123`，强烈建议改为强密码）。
- 若需从服务器拉取私有 GitHub 仓库，需要在该服务器配置 **GitHub Personal Access Token 或 Deploy Key**（可复用你已提供的 PAT，或将代码改为由我本地推送）。

### 6. 数据与账号策略（可选，默认按演示）
- 是否保留演示班级/学生数据（默认保留）。
- 是否在部署后改用**正式教师账号体系**（注册 + 管理员审核），还是先用演示「李老师」。

### 7. CI/CD（可选，默认不做）
- 用户引用了 CircleCI 插件，但**本项目默认不做 CI/CD**（避免增加复杂度）。若需要每次推送自动构建并部署到该服务器，请单独说明，我再补 CircleCI 工作流。