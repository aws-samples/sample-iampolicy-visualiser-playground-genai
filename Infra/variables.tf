variable "project_name" {
  description = "Name of the project - used as prefix for all resources"
  type        = string
  default     = "iam-policy-generator"
}

variable "region" {
  type        = string
  description = "AWS Region"
  default     = "us-east-1"
}
variable "vpc_id" {
  type        = string
  description = "VPC id"
}
variable "pvt_subnet" {
  type        = string
  description = "private subnet for vpc"
}
variable "pvt_subnet_2" {
  type        = string
  description = "private subnet 2 for vpc"
}
# variable "route_table_id" {
#   type        = string
#   description = "route table id for private subnet"
# }
variable "kms_key_arn" {
  description = "ARN of KMS key for encryption"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "ARN of pre-validated ACM certificate (optional - use instead of domain_name)"
  type        = string
  default     = null
}

variable "domain_name" {
  description = "Domain name for SSL certificate (required for HTTPS)"
  type        = string

  validation {
    condition     = length(var.domain_name) > 0 && can(regex("^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\\.[a-zA-Z]{2,}$", var.domain_name))
    error_message = "Domain name is required and must be a valid domain format (e.g., example.com)."
  }
}
