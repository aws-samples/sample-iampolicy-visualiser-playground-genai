# Data source for CloudFront IP ranges
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Security group for internal ALB"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow HTTPS traffic from CloudFront"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  egress {
    description     = "Allow all traffic to ecs tasks"
    protocol        = "-1"
    from_port       = 0
    to_port         = 0
    security_groups = [aws_security_group.ecs_tasks.id]
  }
}
# Application Load Balancer
resource "aws_lb" "main" {
  name                       = "${var.project_name}-alb"
  internal                   = true
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.alb.id]
  subnets                    = [var.pvt_subnet, var.pvt_subnet_2]
  enable_deletion_protection = true
  drop_invalid_header_fields = true

  # Enable ALB access logging
  access_logs {
    bucket  = aws_s3_bucket.logs.id
    prefix  = "alb-logs"
    enabled = true
  }

  depends_on = [aws_s3_bucket_policy.logs]
}
# ALB Target Group
resource "aws_lb_target_group" "app" {
  name        = "${var.project_name}-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "3000"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }
}
# HTTPS listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn != null ? var.certificate_arn : aws_acm_certificate.app[0].arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
# Output the ALB DNS name
output "alb_endpoint" {
  value       = "https://${aws_lb.main.dns_name}"
  description = "The HTTPS endpoint of the load balancer"
}