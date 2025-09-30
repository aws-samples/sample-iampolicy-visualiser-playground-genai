# main.tf
provider "aws" {
  region = var.region # or your preferred region
}

# ACM Certificate (only if certificate_arn not provided)
resource "aws_acm_certificate" "app" {
  count             = var.certificate_arn == null && var.domain_name != null ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-certificate"
  }
}

# ECR Repository
resource "aws_ecr_repository" "app" {
  name                 = "${var.project_name}-ecr-repo"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = var.kms_key_arn
  }
}
# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}-app"
  retention_in_days = 365
  kms_key_id        = var.kms_key_arn
}
resource "null_resource" "finch_build_push" {
  depends_on = [aws_ecr_repository.app]
  # Trigger when image path changes or force update using timestamp
  triggers = {
    image_path_sha = filesha256("${local.image_path}/Dockerfile")
    app_code_sha   = join(",", [for f in fileset(local.image_path, "**") : filesha256("${local.image_path}/${f}")])
  }
  provisioner "local-exec" {
    command     = <<EOT
#!/bin/bash
set -e
# Function to initialize Finch VM
initialize_finch_vm() {
    echo "Initializing new Finch VM..."
    finch vm init --cpus 2 --memory 4
    sleep 15
}
# Function to start Finch VM
start_finch_vm() {
    echo "Starting Finch VM..."
    finch vm start
    sleep 10
}
# Check if Finch VM exists and its status
if ! finch vm status >/dev/null 2>&1; then
    echo "Finch VM does not exist..."
    initialize_finch_vm
else
    # Check if VM is running
    VM_STATUS=$(finch vm status 2>/dev/null || echo "unknown")
    
    if [[ $VM_STATUS == *"Running"* ]]; then
        echo "Finch VM is already running"
    else
        echo "Finch VM exists but is not running"
        start_finch_vm
    fi
fi
echo "Starting build and push process..."
# Set platform for build
export DOCKER_DEFAULT_PLATFORM=linux/amd64
# ECR Login
echo "Logging into ECR..."
aws ecr get-login-password --region ${local.region} | finch login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}
# Build with platform specification
echo "Building image..."
finch build \
  --platform linux/amd64 \
  --no-cache \
  -f ${local.image_path}/DOCKERFILE \
  -t ${aws_ecr_repository.app.repository_url}:latest \
  "${local.image_path}"
# Push image with increased timeout
echo "Pushing image to ECR..."
finch push --all-platforms ${aws_ecr_repository.app.repository_url}:latest
echo "Build and push process completed"
EOT
    interpreter = ["/bin/bash", "-c"]
    environment = {
      DOCKER_DEFAULT_PLATFORM = "linux/amd64"
    }
  }
}
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  container_definitions = jsonencode([{
    name                   = "${var.project_name}-container"
    image                  = "${aws_ecr_repository.app.repository_url}:latest"
    readonlyRootFilesystem = true
    portMappings = [{
      containerPort = 3000
      hostPort      = 3000
      protocol      = "tcp"
    }]
    essential = true
    environment = [
      {
        name  = "NODE_ENV"
        value = "production"
      }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.app.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
}
# ECS Service
resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  launch_type     = "FARGATE"
  desired_count   = 3
  network_configuration {
    subnets          = [var.pvt_subnet, var.pvt_subnet_2]
    assign_public_ip = false
    security_groups  = [aws_security_group.ecs_tasks.id]
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "${var.project_name}-container"
    container_port   = 3000
  }
  depends_on = [aws_lb_listener.https]
}
# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-ecs-tasks-sg"
  description = "Allow inbound access to the ECS tasks from the load_balancer"
  vpc_id      = var.vpc_id

  # HTTPS outbound for AWS API calls (Bedrock, ECR, etc.)
  egress {
    description = "HTTPS outbound for AWS APIs"
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP outbound for package downloads, health checks
  egress {
    description = "HTTP outbound for package downloads"
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  # DNS resolution
  egress {
    description = "DNS resolution"
    protocol    = "udp"
    from_port   = 53
    to_port     = 53
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_security_group_rule" "ecs_to_alb" {
  type                     = "ingress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.ecs_tasks.id
  description              = "Allow HTTP traffic on port 3000 from ALB"
}
# IAM Role for ECS
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project_name}-ecs-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}
resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
# Add ECR pull permissions
resource "aws_iam_role_policy_attachment" "ecs_ecr_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Add Bedrock permissions to the ECS task role
resource "aws_iam_policy" "bedrock_policy" {
  name        = "${var.project_name}-bedrock-policy"
  description = "Policy to allow invoking Bedrock models"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:*:*:provisioned-model/*",
          "arn:aws:bedrock:*:*:foundation-model/*",
          "arn:aws:bedrock:*:*:inference-profile/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "bedrock_policy_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.bedrock_policy.arn
}
# Data source for AZs
data "aws_availability_zones" "available" {}
data "aws_caller_identity" "this" {}
data "aws_region" "this" {}
locals {
  account_id = data.aws_caller_identity.this.account_id
  region     = data.aws_region.this.id
  image_path = "../Bedrock"
}
# Output
output "ecs_service_name" {
  value       = aws_ecs_service.main.name
  description = "The name of the ECS service"
}