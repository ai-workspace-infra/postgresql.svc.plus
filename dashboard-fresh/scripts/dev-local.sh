#!/usr/bin/env bash

# Start development server with local backend
echo "🚀 Starting Fresh development server..."
echo "   Environment: SIT"
echo "   Backend: http://localhost:8080"
echo ""

export RUNTIME_ENV=sit
export AUTH_URL=http://localhost:8080
export API_BASE_URL=http://localhost:8090

deno task dev
