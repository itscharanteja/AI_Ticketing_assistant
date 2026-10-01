#!/bin/bash

# Ensure script cleans up child processes on exit (Ctrl+C)
trap 'echo -e "\n🛑 Stopping all services..."; kill 0; exit 0' SIGINT SIGTERM EXIT

echo "=================================================="
echo "🚀 Starting AI Ticketing Assistant (Local Mode)"
echo "=================================================="

# Load .env reliably on macOS and Linux
if [ -f .env ]; then
  echo "📄 Loading environment variables from .env..."
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Trim carriage returns and spaces
    key=$(echo "$key" | tr -d '\r' | xargs)
    # Skip comments and empty lines
    case "$key" in
      \#*|"") continue ;;
    esac
    value=$(echo "$value" | tr -d '\r' | sed -e 's/^["'\'' ]*//' -e 's/["'\'' ]*$//')
    export "$key"="$value"
  done < .env
fi

# Database defaults
export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5432}"
export DB_USER="${DB_USER:-postgres}"
export DB_PASS="${DB_PASS:-password}"
export DB_NAME="${DB_NAME:-ticketdb}"

# Service defaults
export PORT_TICKET=5001
export PORT_AI=6001
export TICKET_SERVICE_URL="http://localhost:${PORT_TICKET}"
export REACT_APP_TICKET_API_URL="http://localhost:${PORT_TICKET}"
export REACT_APP_AI_API_URL="http://localhost:${PORT_AI}"

# Install dependencies if node_modules are missing
if [ ! -d "ticket-service/node_modules" ]; then
  echo "📦 Installing ticket-service dependencies..."
  (cd ticket-service && npm install)
fi

if [ ! -d "ai-service/node_modules" ]; then
  echo "📦 Installing ai-service dependencies..."
  (cd ai-service && npm install)
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  (cd frontend && npm install)
fi

echo ""
echo "=================================================="
echo " Starting Services:"
echo " 1. Ticket Service: http://localhost:${PORT_TICKET}"
echo " 2. AI Service:     http://localhost:${PORT_AI}"
echo " 3. Frontend:       http://localhost:3000"
echo "=================================================="
echo "Press Ctrl+C at any time to stop all services."
echo ""

# 1. Start Ticket Service
(
  cd ticket-service
  PORT=${PORT_TICKET} npm start 2>&1 | sed -e 's/^/[Ticket-Service] /'
) &

# 2. Start AI Service
(
  cd ai-service
  PORT=${PORT_AI} TICKET_SERVICE_URL=${TICKET_SERVICE_URL} npm start 2>&1 | sed -e 's/^/[AI-Service]     /'
) &

# 3. Start Frontend
(
  cd frontend
  BROWSER=none npm start 2>&1 | sed -e 's/^/[Frontend]       /'
) &

# Wait for all background processes
wait
