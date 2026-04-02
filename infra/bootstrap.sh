#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  FightGPT — Full Deploy Bootstrap
#  Usage: bash infra/bootstrap.sh
#
#  What this does (fully automated):
#   1. Installs Terraform if not present
#   2. Provisions EC2 + SG + Elastic IP on AWS
#   3. EC2 self-configures via cloud-init (Node, PM2, Nginx, app)
#   4. Sets GitHub Actions secrets (EC2_HOST, EC2_USER, EC2_SSH_KEY)
#   5. Sets up Certbot SSL once DNS propagates
# ─────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"
TFVARS="$TERRAFORM_DIR/terraform.tfvars"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  FIGHTGPT — AUTOMATED DEPLOY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# ── 0. Pre-flight checks ──────────────────────────────────────
if [ ! -f "$TFVARS" ]; then
    echo -e "${RED}✗ terraform.tfvars not found!${NC}"
    echo "  Run: cp $TERRAFORM_DIR/terraform.tfvars.example $TFVARS"
    echo "  Then fill in your real values."
    exit 1
fi

# ── 1. Install Terraform (macOS) ──────────────────────────────
if ! command -v terraform &>/dev/null; then
    echo -e "${YELLOW}→ Installing Terraform...${NC}"
    if command -v brew &>/dev/null; then
        brew tap hashicorp/tap
        brew install hashicorp/tap/terraform
    else
        echo -e "${RED}✗ Homebrew not found. Install Terraform manually: https://developer.hashicorp.com/terraform/install${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Terraform $(terraform version -json | python3 -c "import sys,json; print(json.load(sys.stdin)['terraform_version'])")${NC}"

# ── 2. Terraform init + apply ─────────────────────────────────
echo -e "\n${CYAN}→ Provisioning AWS infrastructure...${NC}"
cd "$TERRAFORM_DIR"
terraform init -input=false
terraform apply -input=false -auto-approve

# ── 3. Capture outputs ───────────────────────────────────────
ELASTIC_IP=$(terraform output -raw elastic_ip)
SSH_KEY_PATH="$SCRIPT_DIR/fightgpt.pem"
GITHUB_REPO=$(terraform output -raw 2>/dev/null || grep 'github_repo' "$TFVARS" | awk -F'"' '{print $2}')
DOMAIN=$(grep 'domain' "$TFVARS" | awk -F'"' '{print $2}')
GITHUB_TOKEN=$(grep 'github_token' "$TFVARS" | awk -F'"' '{print $2}')

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Infrastructure ready!${NC}"
echo -e "${GREEN}  Elastic IP: ${ELASTIC_IP}${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── 4. Set GitHub Actions secrets ────────────────────────────
echo -e "\n${CYAN}→ Setting GitHub Actions secrets...${NC}"
PRIVATE_KEY=$(cat "$SSH_KEY_PATH")

GH_TOKEN="$GITHUB_TOKEN" gh secret set EC2_HOST    --repo "$GITHUB_REPO" --body "$ELASTIC_IP"
GH_TOKEN="$GITHUB_TOKEN" gh secret set EC2_USER    --repo "$GITHUB_REPO" --body "ubuntu"
GH_TOKEN="$GITHUB_TOKEN" gh secret set EC2_SSH_KEY --repo "$GITHUB_REPO" --body "$PRIVATE_KEY"

echo -e "${GREEN}✓ GitHub secrets set: EC2_HOST, EC2_USER, EC2_SSH_KEY${NC}"

# ── 5. Wait for cloud-init to finish ─────────────────────────
echo -e "\n${CYAN}→ Waiting for EC2 cloud-init to complete (~3 min)...${NC}"
echo "  (you can watch progress with:)"
echo "  ssh -i $SSH_KEY_PATH ubuntu@$ELASTIC_IP 'tail -f /var/log/fightgpt-setup.log'"
echo ""

# Poll health endpoint
MAX_WAIT=300
WAITED=0
until curl -s --connect-timeout 5 "http://$ELASTIC_IP/health" | grep -q "ok\|healthy\|status" 2>/dev/null; do
    sleep 10
    WAITED=$((WAITED+10))
    echo "  Waiting... ${WAITED}s / ${MAX_WAIT}s"
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo -e "${YELLOW}  App not up yet — cloud-init may still be running.${NC}"
        echo "  Check: ssh -i $SSH_KEY_PATH ubuntu@$ELASTIC_IP 'pm2 logs'"
        break
    fi
done

# ── 6. SSL via Certbot ────────────────────────────────────────
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MANUAL STEP REQUIRED — DNS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Point your DNS A record:"
echo -e "  ${CYAN}${DOMAIN}${NC}  →  ${GREEN}${ELASTIC_IP}${NC}"
echo ""
echo "  Once DNS propagates (~2-10 min), run this to enable SSL:"
echo -e "  ${CYAN}ssh -i $SSH_KEY_PATH ubuntu@$ELASTIC_IP 'sudo certbot --nginx --non-interactive --agree-tos -m admin@fightinggame.online -d ${DOMAIN}'${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deploy complete!"
echo "  API (HTTP now):  http://${DOMAIN}"
echo "  API (after SSL): https://${DOMAIN}"
echo "  SSH:             ssh -i $SSH_KEY_PATH ubuntu@${ELASTIC_IP}"
echo "  Logs:            ssh -i $SSH_KEY_PATH ubuntu@${ELASTIC_IP} 'pm2 logs'"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
