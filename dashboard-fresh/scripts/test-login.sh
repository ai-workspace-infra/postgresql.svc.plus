#!/usr/bin/env bash

# Test login API
echo "Testing login API..."
echo ""

curl -X POST http://localhost:8003/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "demo@svc.plus",
    "password": "demo",
    "remember": true
  }' \
  2>&1

echo ""
echo "Done."
