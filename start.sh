#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT=5170

# 如果端口被占用，先结束占用该端口的进程
if lsof -ti :$PORT >/dev/null 2>&1; then
  echo "端口 $PORT 被占用，正在结束占用进程..."
  lsof -ti :$PORT | xargs kill
fi

# 首次运行时安装依赖
if [ ! -d node_modules ]; then
  echo "未检测到依赖，正在安装..."
  npm install
fi

npm run dev -- --port $PORT --strictPort
