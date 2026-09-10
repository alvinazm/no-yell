#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT=3000

# 释放占用端口
if command -v lsof >/dev/null 2>&1; then
  if lsof -ti :$PORT >/dev/null 2>&1; then
    echo "端口 $PORT 被占用，正在结束占用进程..."
    lsof -ti :$PORT | xargs kill -TERM 2>/dev/null || true
    sleep 0.5
  fi
fi

# 首次运行时安装依赖
if [ ! -d node_modules ]; then
  echo "未检测到依赖，正在安装..."
  npm install
fi

npm run dev -- --host 0.0.0.0 --port $PORT
