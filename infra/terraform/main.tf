terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# ─── SSH KEY PAIR ────────────────────────────────────────────────────────────
resource "tls_private_key" "fightgpt" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "fightgpt" {
  key_name   = "${var.app_name}-key"
  public_key = tls_private_key.fightgpt.public_key_openssh
}

# Save private key locally
resource "local_file" "private_key" {
  content         = tls_private_key.fightgpt.private_key_pem
  filename        = "${path.module}/../${var.app_name}.pem"
  file_permission = "0600"
}

# ─── SECURITY GROUP ──────────────────────────────────────────────────────────
resource "aws_security_group" "fightgpt" {
  name        = "${var.app_name}-sg"
  description = "FightGPT API security group"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.app_name}-sg"
    Project = var.app_name
  }
}

# ─── AMI — Latest Ubuntu 22.04 LTS ──────────────────────────────────────────
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ─── EC2 INSTANCE ────────────────────────────────────────────────────────────
resource "aws_instance" "fightgpt" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.fightgpt.key_name
  vpc_security_group_ids = [aws_security_group.fightgpt.id]

  # Cloud-init: runs ec2-setup.sh on first boot automatically
  user_data = base64encode(templatefile("${path.module}/cloud-init.sh", {
    mongodb_uri    = var.mongodb_uri
    gemini_api_key = var.gemini_api_key
    domain         = var.domain
    github_repo    = var.github_repo
  }))

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name    = "${var.app_name}-api"
    Project = var.app_name
    Env     = "production"
  }
}

# ─── ELASTIC IP ──────────────────────────────────────────────────────────────
resource "aws_eip" "fightgpt" {
  instance = aws_instance.fightgpt.id
  domain   = "vpc"

  tags = {
    Name    = "${var.app_name}-eip"
    Project = var.app_name
  }
}
