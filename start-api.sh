#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR"
docker-compose up -d postgres redis

cd apps/api
# Prefer local .venv, fallback to legacy symlink if present
if [[ -d ".venv" ]]; then
  source .venv/bin/activate
elif [[ -d "venv" ]]; then
  source venv/bin/activate
else
  echo "No virtual environment found in apps/api (.venv or venv). Aborting." >&2
  exit 1
fi

export PYTHONPATH="$ROOT_DIR:${PYTHONPATH:-}"
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
