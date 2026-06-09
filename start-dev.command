#!/bin/zsh
cd "$(dirname "$0")"
echo "→ Installing dependencies..."
npm install
echo ""
echo "→ Starting FMBC dev server..."
echo "→ Open http://localhost:3000 in your browser"
echo ""
npm run dev
