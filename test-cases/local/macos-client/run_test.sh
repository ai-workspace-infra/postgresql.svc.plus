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

# Build an effective stunnel config with optional overrides
STUNNEL_CONF_EFFECTIVE="$STUNNEL_CONF"
TMP_CONF=""
CAFILE=""
for p in /etc/ssl/cert.pem \
         /usr/local/etc/openssl@3/cert.pem \
         /opt/homebrew/etc/openssl@3/cert.pem \
         /usr/local/etc/openssl@1.1/cert.pem \
         /opt/homebrew/etc/openssl@1.1/cert.pem; do
    if [ -f "$p" ]; then
        CAFILE="$p"
        break
    fi
done

if [ -n "$CAFILE" ] || [ -n "${STUNNEL_INSECURE:-}" ]; then
    TMP_CONF="$(mktemp /tmp/stunnel-conf.XXXXXX)"
    cp "$STUNNEL_CONF" "$TMP_CONF"
    if [ -n "$CAFILE" ]; then
        perl -0pi -e "s|^CAfile\\s*=.*$|CAfile = $CAFILE|m" "$TMP_CONF"
        echo "🔐 Using CA bundle: $CAFILE"
    fi
    if [ -n "${STUNNEL_INSECURE:-}" ]; then
        perl -0pi -e 's|^verify\\s*=.*$|verify = 0|m; s|^checkHost\\s*=|; checkHost =|m' "$TMP_CONF"
        echo "⚠️  STUNNEL_INSECURE=1 set: TLS verification disabled"
    fi
    STUNNEL_CONF_EFFECTIVE="$TMP_CONF"
fi

# Check if port 15432 is free
if lsof -i :15432 >/dev/null; then
    echo -e "${RED}❌ Port 15432 is already in use. Please free it first (e.g., kill running stunnel).${NC}"
    exit 1
fi

echo "🚀 Starting Stunnel..."
stunnel "$STUNNEL_CONF_EFFECTIVE" > /tmp/stunnel-test-stdout.log 2>&1 &
STUNNEL_PID=$!
echo "📝 Stunnel PID: $STUNNEL_PID"

cleanup() {
    echo ""
    echo "🛑 Stopping Stunnel..."
    kill $STUNNEL_PID 2>/dev/null || true
    if [ -n "$TMP_CONF" ] && [ -f "$TMP_CONF" ]; then
        rm -f "$TMP_CONF"
    fi
    echo "🧹 Done."
}
trap cleanup EXIT

echo "⏳ Waiting for tunnel to initialize (2s)..."
sleep 2

# Check if process is still running (ps may be restricted)
if ! ps -p $STUNNEL_PID >/dev/null 2>&1; then
    if ! kill -0 $STUNNEL_PID 2>/dev/null; then
        echo -e "${RED}❌ Stunnel failed to start. Check logs:${NC}"
        cat /tmp/stunnel-test-mac.log
        exit 1
    fi
fi

if ! kill -0 $STUNNEL_PID 2>/dev/null; then
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
