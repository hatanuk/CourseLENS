#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

# Find Python: prefer venv in my-app, then project root, else system
if [[ -f venv/bin/python ]]; then
  PY=venv/bin/python
elif [[ -f ../venv/bin/python ]]; then
  PY=../venv/bin/python
else
  PY=python
fi

exec "$PY" -m uvicorn main:app --host 0.0.0.0 --port 8000 --app-dir app/embeddings-server
