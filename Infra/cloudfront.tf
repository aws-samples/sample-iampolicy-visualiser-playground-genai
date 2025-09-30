# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.project_name}-oac"
  description                       = "Origin Access Control for ${var.project_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "main" {
  count = var.domain_name != null ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${var.project_name}"
  price_class         = "PriceClass_100"
  default_root_object = "index.html"

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only" # Always use HTTPS
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  default_cache_behavior {
    allowed_methods            = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "alb-origin"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.main.id
    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
      headers = ["*"]
    }
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn != null ? var.certificate_arn : aws_acm_certificate.app[0].arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  logging_config {
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    include_cookies = false
    prefix          = "cloudfront-logs/"
  }
  depends_on = [
    aws_s3_bucket_acl.logs,
    aws_s3_bucket_ownership_controls.logs,
    aws_s3_bucket_public_access_block.logs
  ]
  web_acl_id = aws_wafv2_web_acl.main.arn
}
resource "aws_cloudfront_response_headers_policy" "main" {
  name = "${var.project_name}-headers-policy"
  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
      preload                    = true
    }
  }
}

resource "aws_wafv2_web_acl" "main" {
  name  = "${var.project_name}-waf"
  scope = "CLOUDFRONT"
  default_action {
    allow {}
  }
  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 1
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }
  rule {
    name     = "AWSManagedRulesAnonymousIpList"
    priority = 2
    override_action {
      count {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAnonymousIpList"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesAnonymousIpList"
      sampled_requests_enabled   = true
    }
  }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf"
    sampled_requests_enabled   = true
  }
}

# CloudWatch Log Group for WAF logs
resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${var.project_name}"
  retention_in_days = 365
  kms_key_id        = var.kms_key_arn
}

# WAF logging configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }
}
output "cloudfront_domain" {
  value       = var.domain_name != null ? "https://${aws_cloudfront_distribution.main[0].domain_name}" : null
  description = "CloudFront domain with HTTPS"
}