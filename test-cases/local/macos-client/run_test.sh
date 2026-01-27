#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🍎 macOS Local Integration Test${NC}"
echo "=============================="

# Check requirements
if ! command -v stunnel &> /dev/null; then
    echo -e "${RED}❌ stunnel not found. Please install: brew install stunnel${NC}"
    exit 1
fi
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql not found. Please install: brew install libpq${NC}"
    exit 1
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STUNNEL_CONF="$DIR/stunnel.conf"
SQL_FILE="$DIR/verify_extensions.sql"

# Check if port 15432 is free
if lsof -i :15432 >/dev/null; then
    echo -e "${RED}❌ Port 15432 is already in use. Please free it first (e.g., kill running stunnel).${NC}"
    exit 1
fi

echo "🚀 Starting Stunnel..."
stunnel "$STUNNEL_CONF" > /tmp/stunnel-test-stdout.log 2>&1 &
STUNNEL_PID=$!
echo "📝 Stunnel PID: $STUNNEL_PID"

cleanup() {
    echo ""
    echo "🛑 Stopping Stunnel..."
    kill $STUNNEL_PID 2>/dev/null || true
    echo "🧹 Done."
}
trap cleanup EXIT

echo "⏳ Waiting for tunnel to initialize (2s)..."
sleep 2

# Check if process is still running
if ! ps -p $STUNNEL_PID > /dev/null; then
    echo -e "${RED}❌ Stunnel failed to start. Check logs:${NC}"
    cat /tmp/stunnel-test-mac.log
    exit 1
fi

echo "🧪 Running SQL Tests..."
echo "Target: localhost:15432 -> postgresql.svc.plus:443"

# Default password if not set
export PGPASSWORD=${PGPASSWORD:-otdcRLTJamszk3AE}
export PGHOST=127.0.0.1
export PGPORT=15432
export PGUSER=postgres
export PGDATABASE=postgres

if psql -f "$SQL_FILE"; then
    echo ""
    echo -e "${GREEN}✅ ALL TESTS PASSED SUCCESSFULLY!${NC}"
else
    echo ""
    echo -e "${RED}❌ TESTS FAILED.${NC}"
    exit 1
fi
