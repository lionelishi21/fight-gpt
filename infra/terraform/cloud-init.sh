#!/bin/bash
# Cloud-init script — runs automatically on first EC2 boot
# Logs available at: /var/log/cloud-init-output.log
set -e
exec > >(tee /var/log/fightgpt-setup.log) 2>&1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " FightGPT EC2 Cloud-Init — $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. System
apt-get update -y && apt-get upgrade -y
apt-get install -y git nginx certbot python3-certbot-nginx curl build-essential
# The analysis/ingestion queue (BullMQ) and rate limiter need Redis on localhost.
# The AWS migration's provisioning omitted it, leaving the worker unable to
# process any job. redis-server binds to 127.0.0.1 by default.
apt-get install -y redis-server
systemctl enable --now redis-server

# 2. Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. PM2
# Piping pm2's own stdout into bash is fragile - its banner/log lines
# ("Monitor:", "$", box-drawing chars, etc.) get executed as commands and
# fail, and since this whole script runs under `set -e`, that silently
# killed cloud-init before it ever reached cloning the repo or starting
# the app. We're already root here, so pm2 can write the systemd unit
# directly without needing the copy-paste-able sudo command it prints for
# non-root users.
npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

# 4. Log dir
mkdir -p /var/log/fightgpt
chown ubuntu:ubuntu /var/log/fightgpt

# 5. Clone repo
cd /home/ubuntu
git clone https://github.com/${github_repo}.git fight-gpt
chown -R ubuntu:ubuntu fight-gpt

# 6. Install deps & build
cd /home/ubuntu/fight-gpt/fight-gpt-node-backend
npm ci --omit=dev
npm install --save-dev tsx typescript
npm run build

# 7. Write .env
cat > /home/ubuntu/fight-gpt/fight-gpt-node-backend/.env << 'ENVEOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=${mongodb_uri}
GEMINI_API_KEY=${gemini_api_key}
PYTHON_AI_SERVICE_URL=http://localhost:8000
ENVEOF
chown ubuntu:ubuntu /home/ubuntu/fight-gpt/fight-gpt-node-backend/.env
chmod 600 /home/ubuntu/fight-gpt/fight-gpt-node-backend/.env

# 8. Start PM2 as ubuntu user
sudo -u ubuntu bash -c "
  cd /home/ubuntu/fight-gpt/fight-gpt-node-backend
  pm2 start ecosystem.config.js --env production
  pm2 save
"

# 9. Nginx config
cp /home/ubuntu/fight-gpt/fight-gpt-node-backend/nginx.conf /etc/nginx/sites-available/fightgpt-api

# Replace domain placeholder in nginx config
sed -i 's/api\.fightinggames\.io/${domain}/g' /etc/nginx/sites-available/fightgpt-api

ln -sf /etc/nginx/sites-available/fightgpt-api /etc/nginx/sites-enabled/fightgpt-api
rm -f /etc/nginx/sites-enabled/default

# Temporary HTTP-only nginx config until Certbot runs
cat > /etc/nginx/sites-available/fightgpt-api << 'NGINXEOF'
server {
    listen 80;
    server_name ${domain};

    client_max_body_size 200M;
    proxy_read_timeout 600s;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        'upgrade';
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
NGINXEOF

nginx -t && systemctl reload nginx
systemctl enable nginx

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Setup complete! $(date)"
echo " API running at http://${domain}"
echo " Next: point DNS then run certbot for SSL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
