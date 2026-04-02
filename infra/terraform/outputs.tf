output "elastic_ip" {
  description = "Elastic IP — point api.fightinggames.io A record here"
  value       = aws_eip.fightgpt.public_ip
}

output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.fightgpt.id
}

output "ssh_command" {
  description = "SSH command to access the server"
  value       = "ssh -i ../fightgpt.pem ubuntu@${aws_eip.fightgpt.public_ip}"
}

output "api_url" {
  description = "API URL (once DNS is pointed)"
  value       = "https://${var.domain}"
}

output "setup_log" {
  description = "Watch cloud-init setup progress"
  value       = "ssh -i ../fightgpt.pem ubuntu@${aws_eip.fightgpt.public_ip} 'tail -f /var/log/cloud-init-output.log'"
}
