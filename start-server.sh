#!/bin/bash
# Production launcher for NEX-SCOPE standalone server.
# Usage: ./start-server.sh
# Requires: `npm run build` already executed (creates .next/standalone/).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f ".next/standalone/server.js" ]; then
  echo "[ERROR] .next/standalone/server.js not found."
  echo "        Run 'npm run build' first."
  exit 1
fi

if [ -z "${JWT_SECRET:-}" ]; then
  if [ "${NODE_ENV:-}" = "production" ]; then
    echo "[ERROR] JWT_SECRET must be set in production."
    exit 1
  fi
  export JWT_SECRET="dev-only-insecure-secret-do-not-use-in-production"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="file:./db/custom.db"
fi

export NODE_ENV="${NODE_ENV:-production}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"

echo "[nexscope] Starting on http://${HOSTNAME}:${PORT} (${NODE_ENV})"
exec node .next/standalone/server.js
