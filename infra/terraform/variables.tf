variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "AWS CLI profile"
  type        = string
  default     = "test-automation-deploy"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "app_name" {
  description = "Application name (used for resource naming)"
  type        = string
  default     = "fightgpt"
}

variable "domain" {
  description = "API domain name"
  type        = string
  default     = "api.fightinggame.online"
}

variable "mongodb_uri" {
  description = "MongoDB Atlas connection string"
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Google Gemini API key"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repo in owner/repo format (e.g. lionelishi21/fight-gpt)"
  type        = string
}

variable "github_token" {
  description = "GitHub personal access token (needs repo + secrets scope)"
  type        = string
  sensitive   = true
}
