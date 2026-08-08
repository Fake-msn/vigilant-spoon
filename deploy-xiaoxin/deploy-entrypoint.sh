#!/usr/bin/env bash
set -e

# 确保数据库目录存在
mkdir -p "$(dirname "$DATABASE_PATH")"

# 仅当数据库文件不存在时灌入演示数据，避免每次启动清库、丢失线上数据
if [ ! -f "$DATABASE_PATH" ]; then
  echo "==> Seeding demo data (first run) ..."
  python /app/server/scripts/seed.py "$DATABASE_PATH"
else
  echo "==> Database already exists, skip seed."
fi

# 启动 FastAPI 服务，监听 0.0.0.0:8000
echo "==> Starting uvicorn on :8000..."
cd /app
exec uvicorn app.main:app --host 0.0.0.0 --port 8000