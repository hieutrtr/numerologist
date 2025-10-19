#!/bin/bash

# Numerologist Development Startup Script
echo "🚀 Starting Numerologist Development Environment..."

# Set project root
PROJECT_ROOT="/home/hieutt50/projects/numerologist"
cd $PROJECT_ROOT

# Start databases
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis
sleep 2

# Start API
echo "🔧 Starting FastAPI backend..."
cd $PROJECT_ROOT/apps/api
source venv/bin/activate
export PYTHONPATH=$PROJECT_ROOT:$PYTHONPATH
nohup uvicorn src.main:app --reload --port 8000 > $PROJECT_ROOT/api.log 2>&1 &
API_PID=$!
echo $API_PID > $PROJECT_ROOT/api.pid
echo "   API started (PID: $API_PID) at http://localhost:8000"

# Start Mobile
echo "📱 Starting React Native mobile app..."
cd $PROJECT_ROOT/apps/mobile
nohup expo start --clear --tunnel > $PROJECT_ROOT/mobile.log 2>&1 &
MOBILE_PID=$!
echo $MOBILE_PID > $PROJECT_ROOT/mobile.pid
echo "   Mobile started (PID: $MOBILE_PID)"

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Access points:"
echo "   API:    http://localhost:8000/docs"
echo "   Health: http://localhost:8000/health"
echo "   Mobile: Check logs with: tail -f $PROJECT_ROOT/mobile.log"
echo ""
echo "🛑 To stop all services:"
echo "   bash stop-dev.sh"
