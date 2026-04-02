#!/bin/bash
set -e

APP_DIR="/home/ubuntu/fight-gpt-node-backend"
LOG_DIR="/var/log/fightgpt"
NODE_ENV="production"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " FightGPT API — Deploy $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ensure log dir exists
sudo mkdir -p $LOG_DIR
sudo chown ubuntu:ubuntu $LOG_DIR

cd $APP_DIR

# 1. Pull latest
echo "→ Pulling latest from main..."
git pull origin main

# 2. Install deps (skip devDeps in prod)
echo "→ Installing dependencies..."
npm ci --omit=dev

# 3. Re-install tsx for build (devDep we need at build time)
echo "→ Installing build tools..."
npm install --save-dev tsx typescript

# 4. Type check
echo "→ Type checking..."
npx tsc --noEmit

# 5. Build
echo "→ Building TypeScript..."
npm run build

# 6. Reload or start PM2
echo "→ Reloading PM2..."
if pm2 list | grep -q "fightgpt-api"; then
    pm2 reload ecosystem.config.js --env production
else
    pm2 start ecosystem.config.js --env production
    pm2 save
fi

# 7. Health check
echo "→ Health check..."
sleep 3
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$STATUS" = "200" ]; then
    echo "✓ API is healthy (HTTP $STATUS)"
else
    echo "✗ Health check failed (HTTP $STATUS) — check logs:"
    echo "  pm2 logs fightgpt-api --lines 50"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Deploy complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
