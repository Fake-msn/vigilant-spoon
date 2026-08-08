# ---- Stage 1: build frontend (web-spa / Vite) ----
FROM node:20-slim AS frontend
WORKDIR /build
COPY web-spa/package.json web-spa/package-lock.json ./
RUN npm ci
COPY web-spa/ ./
RUN npm run build

# ---- Stage 2: runtime (FastAPI backend + static frontend) ----
FROM python:3.12-slim
WORKDIR /app

# 安装后端依赖（从 pyproject.toml，安装 app 包）
COPY server/ ./server/
RUN pip install --no-cache-dir ./server

# 拷贝构建好的前端静态产物
COPY --from=frontend /build/dist /app/webspa-dist

# 环境变量
ENV SPA_DIST_DIR=/app/webspa-dist
ENV DATABASE_PATH=/data/demo.db
ENV PYTHONUNBUFFERED=1

# uvicorn 内部监听端口（对外由 Caddy 反代暴露 80/443）
EXPOSE 8000

# 启动入口：建目录 + 首启 seed + 启动 uvicorn
COPY deploy-entrypoint.sh /app/deploy-entrypoint.sh
RUN chmod +x /app/deploy-entrypoint.sh
CMD ["/app/deploy-entrypoint.sh"]