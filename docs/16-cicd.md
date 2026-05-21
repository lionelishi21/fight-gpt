# 16 · GitHub Actions CI/CD

**Priority:** ⚙️ P5 — Platform Health  
**Status:** `todo`  
**Effort:** 2 hours  

---

## Problem

Every backend deploy requires manually SSHing in:
```bash
git pull && npm run build && pm2 reload fightgpt-api
```

This means fixes sit undeployed, and a bad deploy can take the server down.

---

## Implementation

### `.github/workflows/deploy-api.yml`
```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'fight-gpt-node-backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu/fight-gpt-ai-project
            git pull origin main
            cd fight-gpt-node-backend
            npm ci --omit=dev
            npm run build
            pm2 reload fightgpt-api
            echo "Deploy complete at $(date)"
```

### GitHub Secrets to Add
```
EC2_HOST         = your.server.ip
EC2_SSH_KEY      = contents of your .pem private key
```

---

## Benefits

- Every push to `main` auto-deploys in ~2 minutes
- Failed deploys notify via GitHub → no silent failures
- Zero-downtime: `pm2 reload` does rolling restart
- No more forgotten deployments
