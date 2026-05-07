#!/bin/bash
# Build and deploy script for NicheScope
# This ensures static files are properly copied to the standalone server

set -e

echo "🔧 Building NicheScope..."
npx next build

echo "📦 Copying static files to standalone server..."
cp -r .next/static .next/standalone/.next/static

echo "📁 Copying public assets..."
cp -r public .next/standalone/public 2>/dev/null || true

echo "✅ Build complete! Restart the server with: pm2 restart nichescope"
