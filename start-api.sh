#!/bin/bash
cd /home/hieutt50/projects/numerologist
docker-compose up -d postgres redis
cd apps/api
source venv/bin/activate
export PYTHONPATH=/home/hieutt50/projects/numerologist:$PYTHONPATH
uvicorn src.main:app --reload --port 8000
