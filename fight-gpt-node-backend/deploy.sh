#!/bin/bash
set -e

# Dynamically determine the app directory from the script location
APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
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
rm -rf dist
npm run build

# 6. Restart PM2
echo "→ Restarting PM2..."
if pm2 list | grep -q "fightgpt-api"; then
    pm2 restart ecosystem.config.js --env production
else
    pm2 start ecosystem.config.js --env production
    pm2 save
fi

# 7. Health check — hits /api/health (verifies Gemini connectivity, not just "server is up")
echo "→ Health check..."
sleep 5
HEALTH_BODY=$(curl -s http://localhost:3000/api/health)
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✓ API is healthy (HTTP $HEALTH_STATUS): $HEALTH_BODY"
else
    echo "✗ Health check failed (HTTP $HEALTH_STATUS): $HEALTH_BODY"
    echo "  Rolling back to previous commit..."
    git reset --hard HEAD~1
    npm run build
    pm2 restart ecosystem.config.js --env production
    echo "  pm2 logs fightgpt-api --lines 50"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Deploy complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 8. Forensic Log Dump (Always run for this debugging session)
echo "→ Post-Deploy Diagnostics..."
pm2 info fightgpt-api | grep uptime
tail -n 50 $LOG_DIR/error.log
