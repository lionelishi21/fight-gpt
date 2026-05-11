#!/bin/bash
# Run once on a fresh Ubuntu 22.04 EC2 instance
# Usage: bash ec2-setup.sh
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " FightGPT EC2 First-Time Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. System updates
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y ffmpeg

# 1b. Install yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# 2. Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. PM2
sudo npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu | sudo bash

# 4. Nginx
sudo apt-get install -y nginx
sudo systemctl enable nginx

# 5. Certbot (Let's Encrypt SSL)
sudo apt-get install -y certbot python3-certbot-nginx

# 6. Git
sudo apt-get install -y git

# 7. Log dir
sudo mkdir -p /var/log/fightgpt
sudo chown ubuntu:ubuntu /var/log/fightgpt

# 8. Clone repo
# Replace with your actual GitHub repo URL
REPO_URL="https://github.com/YOUR_ORG/fight-gpt-ai-project.git"
cd /home/ubuntu
git clone $REPO_URL
cd fight-gpt-ai-project/fight-gpt-node-backend

# 9. Install deps & build
npm ci --omit=dev
npm install --save-dev tsx typescript
npm run build

# 10. Create .env
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=YOUR_MONGODB_ATLAS_URI
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
PYTHON_AI_SERVICE_URL=http://localhost:8000
ENVEOF
echo "⚠️  Edit .env with real values: nano /home/ubuntu/fight-gpt-ai-project/fight-gpt-node-backend/.env"

# 11. Start PM2
pm2 start ecosystem.config.js --env production
pm2 save

# 12. Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/fightgpt-api
sudo ln -sf /etc/nginx/sites-available/fightgpt-api /etc/nginx/sites-enabled/fightgpt-api
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Next steps:"
echo "  1. Edit .env with real values"
echo "  2. Point DNS: api.fightinggames.io → this EC2 IP"
echo "  3. Run SSL: sudo certbot --nginx -d api.fightinggames.io"
echo "  4. Test: curl https://api.fightinggames.io/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
