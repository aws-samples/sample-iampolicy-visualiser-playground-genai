# IAM Policy Generator and Visualizer

This application helps you generate and visualize AWS Identity and Access Management (IAM) policies using generative AI. It provides a simple interface to:

1. Generate IAM policies based on natural language requirements.
2. Playground to visualize and add/update the permissions in the generated policies.
3. Validate policies for correctness and enhanced security features.

## Features

- Natural language policy generation
- Policy visualization
- Policy validation
- Support for multiple environments (dev/staging/prod). 
   1. Development (dev) - Local development
   2. Staging (staging) - Pre-production testing  
   3. Production (prod) - Live deployment
- MFA enforcement for sensitive operations
   1. MFA Requirements for policy modifications
   2. IP Restrictions for administrative access
   3. Time-based Conditions for temporary access
   4. Region Restrictions to prevent cross-region abuse
- Attribute-based access control (ABAC)

## Getting Started

### Prerequisites

- Node.js (v18 or higher (tested up to v23.11.0))
- AWS account with appropriate permissions (check below)
   1. Bedrock Model Invocation ("bedrock:InvokeModel" and "bedrock:InvokeModelWithResponseStream")
   2. ECS Execution Role Permissions ("AmazonECSTaskExecutionRolePolicy" and "AmazonEC2ContainerRegistryReadOnly")
   3. Access Analyzer Permissions ("accessanalyzer:ValidatePolicy")
- AWS CLI configured with credentials

### Installation

## Infrastructure in AWS Cloud

The application is deployed using a modern and enhanced availability features on AWS infrastructure.

### Core Components
- **Amazon Virtual Private Cloud (Amazon VPC)** with public subnets across availability zones. AZs are dynamically selected from available zones in the specified region, ensuring high availability across geographically separated data centers.
- **Amazon Amazon Elastic Container Service (Amazon ECS)** (Fargate) for container orchestration
- **Application Load Balancer** for traffic distribution
- **Amazon CloudFront** for global content delivery and HTTPS
- **Amazon Amazon Elastic Container Registry (Amazon ECR)** for container image storage
- **Amazon CloudWatch** for logging and monitoring

### Enhanced Security Features
- SG's for Application Load Balancer and Amazon Elastic Container Service (Amazon ECS) tasks
- IAM roles and policies for Amazon Elastic Container Service (Amazon ECS) tasks
- Container image scanning in Amazon Elastic Container Registry (Amazon ECR)

### High Availability
- Multi-AZ deployment across 2 availability zones
- Auto-scaling Amazon Elastic Container Service (Amazon ECS) tasks (3 replicas). Below are the reasons for using replicas -
   1. High Availability: Survives failure of 1 AZ (2 AZs × 1-2 replicas each)
   2. Load Distribution: Handles concurrent AI model requests efficiently
   3. Rolling Deployments: Allows zero-downtime updates (1 replica down, 2 serving)
   4. Cost Optimization: Minimum for HA without over-provisioning
   5. AWS Best Practice: Odd number prevents split-brain scenarios
- Load balancing via Application Load Balancer

## Suggestions for Production Setup

For production setup, please enable the tool to use a valid domain name which is part of mandatory inputs for end-to-end TLS setup if desired.


## Implementation Steps

### 1. Prerequisites Installation

```bash
# Install Finch (MacOS)
brew install finch

# Install AWS CLI
brew install awscli

# Install Terraform
brew install terraform

# Configure AWS CLI
aws configure
```

### 2. Initialize Finch VM

```bash
# Initialize Finch VM with 2 CPUs and 4GB memory
finch vm init --cpus 2 --memory 4

# Start Finch VM
finch vm start

# Verify Finch status
finch vm status
```

### 3. Deploy Infrastructure

Choose your SSL certificate approach:

#### **Option A: Single Apply (Existing Certificate)**
If you have a validated ACM certificate:

1. **Update terraform.tfvars**:
   ```
   domain_name = "your-actual-domain.com"        # Required for Amazon CloudFront
   certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id"
   enable_ssl = true
   ```

2. **Deploy**:
   ```bash
   terraform init
   terraform apply
   ```

#### **Option B: Two-Step Process (New Certificate)**
If you need to create and validate a new certificate:

**Step 1: Create Certificate**
1. **Update terraform.tfvars**:
   ```
   domain_name = "your-actual-domain.com"
   enable_ssl = false
   ```

2. **Deploy**:
   ```bash
   terraform init
   terraform apply
   ```

**Step 2: Enable SSL**
1. **Validate certificate** in AWS Console:
   - Go to ACM → Find certificate ("Pending validation")
   - Add CNAME record to your DNS
   - Wait for "Issued" status (5-30 minutes)

2. **Enable SSL**:
   ```
   enable_ssl = true
   ```

3. **Apply**:
   ```bash
   terraform apply
   ```

### 4. Access the Application

Once deployed, the application can be accessed through:
- Amazon CloudFront URL(HTTPS): Output as Amazon CloudFront_domain
- Application Load Balancer URL(HTTP): Output as Application Load Balancer_endpoint

### 5. Cleanup the resources

```bash
# Destroy infrastructure when no longer needed
terraform destroy

# Confirm by typing 'yes' when prompted

# Stop Finch VM
finch vm stop
```

## Usage

1. Enter your policy requirements in natural language
2. Click "Generate Policy"
3. Review the created policy, explanation, and suggestions
4. Visualize the policy to understand the permissions
5. Use the enhanced policy for better enhanced security features

## Troubleshooting

If you encounter JSON parsing errors:
- Check for proper JSON formatting in the response
- Ensure there are no invisible characters in the policy
- Verify that the policy follows AWS Identity and Access Management (IAM) syntax

## Contributors ()
Anand Krishna Varanasi
Prabhanshu Ranjan
Abhigyan Dandriyal
Urbija Goswami
Sai Shivani Dondapati

## Important Note

This application uses AWS Bedrock AI models to generate IAM policies. All generated content should be treated as AI-assisted suggestions requiring human review and
validation before using.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
