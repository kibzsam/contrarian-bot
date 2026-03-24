#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "=== AI Contrarian Bot - Startup Test ==="
echo ""
echo "1. Building TypeScript..."
npm run build

echo ""
echo "2. Starting bot with 10-second timeout..."
timeout 10s node dist/index.js 2>&1 || true

echo ""
echo "3. Startup test completed"
