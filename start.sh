#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT=5170

# 如果端口被占用，先结束占用该端口的进程
if lsof -ti :$PORT >/dev/null 2>&1; then
  echo "端口 $PORT 被占用，正在结束占用进程..."
  lsof -ti :$PORT | xargs kill -TERM 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if ! lsof -ti :$PORT >/dev/null 2>&1; then break; fi
    sleep 0.3
  done
  if lsof -ti :$PORT >/dev/null 2>&1; then
    echo "进程未响应 SIGTERM，改用 SIGKILL..."
    lsof -ti :$PORT | xargs kill -KILL 2>/dev/null || true
    sleep 0.3
  fi
  if lsof -ti :$PORT >/dev/null 2>&1; then
    echo "端口 $PORT 仍被占用，请手动检查后重试。" >&2
    exit 1
  fi
fi

# 首次运行时安装依赖
if [ ! -d node_modules ]; then
  echo "未检测到依赖，正在安装..."
  npm install
fi

npm run dev -- --port $PORT --strictPort
