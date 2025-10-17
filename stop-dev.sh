#!/bin/bash

# Numerologist Development Shutdown Script
echo "🛑 Stopping Numerologist Development Environment..."

PROJECT_ROOT="/home/hieutt50/projects/numerologist"
cd $PROJECT_ROOT

# Stop API
if [ -f api.pid ]; then
    API_PID=$(cat api.pid)
    echo "Stopping API (PID: $API_PID)..."
    kill $API_PID 2>/dev/null
    rm api.pid
fi

# Stop Mobile
if [ -f mobile.pid ]; then
    MOBILE_PID=$(cat mobile.pid)
    echo "Stopping Mobile (PID: $MOBILE_PID)..."
    kill $MOBILE_PID 2>/dev/null
    rm mobile.pid
fi

# Stop databases
echo "Stopping databases..."
docker-compose down

echo "✅ All services stopped!"
