// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
// iconConfig.js - Comprehensive mapping of IAM policy service prefixes to their icon paths

// Map IAM policy service prefixes to their icon paths
export const serviceIcons = {
  // Storage Services
  's3': 'assets/Simple-Storage-Service.svg',
  'glacier': 'assets/Simple-Storage-Service-Glacier.svg',
  'storagegateway': 'assets/Storage-Gateway.svg',
  'elasticfilesystem': 'assets/Elastic-File-System.svg',
  'fsx': 'assets/FSx.svg',
  'backup': 'assets/Backup.svg',
  'snowball': 'assets/Snow-Family.svg',
  'datasync': 'assets/DataSync.svg',
  'efs': 'assets/Elastic-File-System.svg',
  
  // Compute Services
  'ec2': 'assets/EC2.svg',
  'lambda': 'assets/Lambda.svg',
  'elasticbeanstalk': 'assets/Elastic-Beanstalk.svg',
  'ecs': 'assets/Elastic-Container-Service.svg',
  'eks': 'assets/Elastic-Kubernetes-Service.svg',
  'batch': 'assets/Batch.svg',
  'serverlessrepo': 'assets/Serverless-Application-Repository.svg',
  'lightsail': 'assets/Lightsail.svg',
  'apprunner': 'assets/App-Runner.svg',
  'outposts': 'assets/Outposts.svg',
  'autoscaling': 'assets/EC2-Auto-Scaling.svg',
  'imagebuilder': 'assets/EC2-Image-Builder.svg',
  
  // Database Services
  'dynamodb': 'assets/DynamoDB.svg',
  'rds': 'assets/RDS.svg',
  'redshift': 'assets/Redshift.svg',
  'elasticache': 'assets/ElastiCache.svg',
  'neptune': 'assets/Neptune.svg',
  'docdb': 'assets/DocumentDB.svg',
  'timestream': 'assets/Timestream.svg',
  'qldb': 'assets/QLDB.svg',
  'dms': 'assets/Database-Migration-Service.svg',
  'memorydb': 'assets/MemoryDB.svg',
  'keyspaces': 'assets/Keyspaces.svg',
  
  // Networking & Content Delivery
  'cloudfront': 'assets/CloudFront.svg',
  'route53': 'assets/Route-53.svg',
  'apigateway': 'assets/API-Gateway.svg',
  'execute-api': 'assets/API-Gateway.svg', // API Gateway execution service
  'elasticloadbalancing': 'assets/Elastic-Load-Balancing.svg',
  'globalaccelerator': 'assets/Global-Accelerator.svg',
  'vpc': 'assets/Virtual-Private-Cloud.svg',
  'directconnect': 'assets/Direct-Connect.svg',
  'apprunner': 'assets/App-Runner.svg',
  'cloudmap': 'assets/Cloud-Map.svg',
  'appmesh': 'assets/App-Mesh.svg',
  'vpclattice': 'assets/VPC-Lattice.svg',
  'transitgateway': 'assets/Transit-Gateway.svg',
  'networkfirewall': 'assets/Network-Firewall.svg',
  'networkmanager': 'assets/Network-Manager.svg',
  
  // Security, Identity & Compliance
  'iam': 'assets/Identity-and-Access-Management.svg',
  'cognito-idp': 'assets/Cognito.svg',
  'cognito-identity': 'assets/Cognito.svg',
  'acm': 'assets/Certificate-Manager.svg',
  'kms': 'assets/Key-Management-Service.svg',
  'secretsmanager': 'assets/Secrets-Manager.svg',
  'waf': 'assets/WAF.svg',
  'shield': 'assets/Shield.svg',
  'guardduty': 'assets/GuardDuty.svg',
  'inspector': 'assets/Inspector.svg',
  'macie': 'assets/Macie.svg',
  'artifact': 'assets/Artifact.svg',
  'detective': 'assets/Detective.svg',
  'securityhub': 'assets/Security-Hub.svg',
  'sso': 'assets/IAM-Identity-Center.svg',
  'ram': 'assets/Resource-Access-Manager.svg',
  'directory': 'assets/Directory-Service.svg',
  'firewall-management': 'assets/Firewall-Manager.svg',
  'auditmanager': 'assets/Audit-Manager.svg',
  'verifiedpermissions': 'assets/Verified-Permissions.svg',
  'verifiedaccess': 'assets/Verified-Access.svg',
  
  // Management & Governance
  'cloudwatch': 'assets/CloudWatch.svg',
  'logs': 'assets/CloudWatch.svg', // CloudWatch Logs uses the same icon
  'cloudformation': 'assets/CloudFormation.svg',
  'cloudtrail': 'assets/CloudTrail.svg',
  'config': 'assets/Config.svg',
  'organizations': 'assets/Organizations.svg',
  'ssm': 'assets/Systems-Manager.svg',
  'trustedadvisor': 'assets/Trusted-Advisor.svg',
  'controlcatalog': 'assets/Control-Catalog.svg',
  'controltower': 'assets/Control-Tower.svg',
  'servicecatalog': 'assets/Service-Catalog.svg',
  'appconfig': 'assets/AppConfig.svg',
  'cloudcontrolapi': 'assets/Cloud-Control-API.svg',
  'fis': 'assets/Fault-Injection-Service.svg',
  'proton': 'assets/Proton.svg',
  'wellarchitected': 'assets/Well-Architected-Tool.svg',
  'chatbot': 'assets/Chatbot.svg',
  'servicequotas': 'assets/Service-Quotas.svg',
  'health': 'assets/Health.svg',
  'license-manager': 'assets/License-Manager.svg',
  'mgn': 'assets/Application-Migration-Service.svg',
  'application-discovery': 'assets/Application-Discovery-Service.svg',
  'cloudshell': 'assets/CloudShell.svg',
  'costexplorer': 'assets/Cost-Explorer.svg',
  'budgets': 'assets/Budgets.svg',
  'savingsplans': 'assets/Savings-Plans.svg',
  'dlm': 'assets/Data-Lifecycle-Manager.svg',
  
  // Analytics
  'athena': 'assets/Athena.svg',
  'emr': 'assets/EMR.svg',
  'cloudtrail': 'assets/CloudTrail.svg',
  'kinesis': 'assets/Kinesis.svg',
  'firehose': 'assets/Kinesis-Firehose.svg',
  'analytics': 'assets/Kinesis-Data-Analytics.svg',
  'opensearch': 'assets/OpenSearch-Service.svg',
  'elasticsearch': 'assets/OpenSearch-Service.svg', // Legacy name
  'msk': 'assets/Managed-Streaming-for-Kafka.svg',
  'glue': 'assets/Glue.svg',
  'lakeformation': 'assets/Lake-Formation.svg',
  'quicksight': 'assets/QuickSight.svg',
  'datazone': 'assets/DataZone.svg',
  'datapipeline': 'assets/Data-Pipeline.svg',
  'cleanrooms': 'assets/Clean-Rooms.svg',
  
  // Application Integration
  'sns': 'assets/Simple-Notification-Service.svg',
  'sqs': 'assets/Simple-Queue-Service.svg',
  'states': 'assets/Step-Functions.svg', // Step Functions
  'eventbridge': 'assets/EventBridge.svg',
  'events': 'assets/EventBridge.svg', // EventBridge (legacy name)
  'appsync': 'assets/AppSync.svg',
  'mq': 'assets/MQ.svg',
  'ses': 'assets/Simple-Email-Service.svg',
  'appflow': 'assets/AppFlow.svg',
  'swf': 'assets/Simple-Workflow-Service.svg',
  'pipes': 'assets/EventBridge-Pipes.svg',
  'scheduler': 'assets/EventBridge-Scheduler.svg',
  
  // Developer Tools
  'codecommit': 'assets/CodeCommit.svg',
  'codebuild': 'assets/CodeBuild.svg',
  'codedeploy': 'assets/CodeDeploy.svg',
  'codepipeline': 'assets/CodePipeline.svg',
  'codeartifact': 'assets/CodeArtifact.svg',
  'codestar': 'assets/CodeStar.svg',
  'cloud9': 'assets/Cloud9.svg',
  'xray': 'assets/X-Ray.svg',
  'cloudcontrol': 'assets/Cloud-Control-API.svg',
  'codecatalyst': 'assets/CodeCatalyst.svg',
  'codeguru': 'assets/CodeGuru.svg',
  'devicefarm': 'assets/Device-Farm.svg',
  
  // Machine Learning
  'sagemaker': 'assets/SageMaker.svg',
  'comprehend': 'assets/Comprehend.svg',
  'translate': 'assets/Translate.svg',
  'rekognition': 'assets/Rekognition.svg',
  'polly': 'assets/Polly.svg',
  'transcribe': 'assets/Transcribe.svg',
  'textract': 'assets/Textract.svg',
  'lex': 'assets/Lex.svg',
  'forecast': 'assets/Forecast.svg',
  'personalize': 'assets/Personalize.svg',
  'lookoutvision': 'assets/Lookout-for-Vision.svg',
  'lookoutequipment': 'assets/Lookout-for-Equipment.svg',
  'lookoutmetrics': 'assets/Lookout-for-Metrics.svg',
  'bedrock': 'assets/Bedrock.svg',
  
  // IoT
  'iot': 'assets/IoT-Core.svg',
  'iotanalytics': 'assets/IoT-Analytics.svg',
  'iotevents': 'assets/IoT-Events.svg',
  'greengrass': 'assets/IoT-Greengrass.svg',
  'iotsitewise': 'assets/IoT-SiteWise.svg',
  'iotthingsgraph': 'assets/IoT-Things-Graph.svg',
  'iotfleethub': 'assets/IoT-Core-Device-Management.svg',
  'iotwireless': 'assets/IoT-Core-Device-Management.svg',
  
  // Mobile
  'amplify': 'assets/Amplify.svg',
  'appsync': 'assets/AppSync.svg',
  'devicefarm': 'assets/Device-Farm.svg',
  'pinpoint': 'assets/Pinpoint.svg',
  
  // Media Services
  'mediaconvert': 'assets/Elemental-MediaConvert.svg',
  'medialive': 'assets/Elemental-MediaLive.svg',
  'mediapackage': 'assets/Elemental-MediaPackage.svg',
  'mediastore': 'assets/Elemental-MediaStore.svg',
  'mediatailor': 'assets/Elemental-MediaTailor.svg',
  'elastictranscoder': 'assets/Elastic-Transcoder.svg',
  'ivs': 'assets/Interactive-Video-Service.svg',
  
  // End User Computing
  'workspaces': 'assets/WorkSpaces.svg',
  'appstream': 'assets/AppStream.svg',
  'worklink': 'assets/WorkLink.svg',
  'workdocs': 'assets/WorkDocs.svg',
  'workmail': 'assets/WorkMail.svg',
  
  // AR & VR
  'sumerian': 'assets/Sumerian.svg',
  
  // Customer Engagement
  'connect': 'assets/Connect.svg',
  'pinpoint': 'assets/Pinpoint.svg',
  'ses': 'assets/Simple-Email-Service.svg',
  
  // Business Applications
  'chime': 'assets/Chime.svg',
  'honeycode': 'assets/Honeycode.svg',
  'wickr': 'assets/Wickr.svg',
  'workmail': 'assets/WorkMail.svg',
  
  // Quantum Technologies
  'braket': 'assets/Braket.svg',
  
  // Blockchain
  'managedblockchain': 'assets/Managed-Blockchain.svg',
  'qldb': 'assets/QLDB.svg',
  
  // Satellite
  'groundstation': 'assets/Ground-Station.svg',
  
  // Robotics
  'robomaker': 'assets/RoboMaker.svg',
  
  // Game Development
  'gamelift': 'assets/GameLift.svg',
  
  // Additional services and aliases
  'ecr': 'assets/Elastic-Container-Registry.svg',
  'transfer': 'assets/Transfer-Family.svg',
  'cloudshell': 'assets/CloudShell.svg',
  'application-autoscaling': 'assets/Application-Auto-Scaling.svg',
  'alexa': 'assets/Alexa-For-Business.svg',
  'pricing': 'assets/Cost-Explorer.svg',
  'support': 'assets/Trusted-Advisor.svg',
  'resource-groups': 'assets/Resource-Groups.svg',
  'tag': 'assets/Resource-Groups.svg',
  'schemas': 'assets/Schema-Registry.svg',
  'account': 'assets/Account-Management.svg',
  'billingconductor': 'assets/Billing-Conductor.svg',
  'cloudwatch-rum': 'assets/CloudWatch.svg',
  'evidently': 'assets/CloudWatch-Evidently.svg',
  'synthetics': 'assets/CloudWatch-Synthetics.svg',
  'rum': 'assets/CloudWatch-RUM.svg',
  'application-insights': 'assets/CloudWatch-Application-Insights.svg',
  'internetmonitor': 'assets/CloudWatch-Internet-Monitor.svg',
  'cloudfront-keyvaluestore': 'assets/CloudFront-KeyValueStore.svg',
  'route53-recovery-control-config': 'assets/Route-53-Application-Recovery-Controller.svg',
  'route53-recovery-cluster': 'assets/Route-53-Application-Recovery-Controller.svg',
  'route53-recovery-readiness': 'assets/Route-53-Application-Recovery-Controller.svg',
  'route53domains': 'assets/Route-53.svg',
  'route53resolver': 'assets/Route-53-Resolver.svg',
  'identitystore': 'assets/IAM-Identity-Center.svg',
  'sso-admin': 'assets/IAM-Identity-Center.svg',
  'sso-oauth': 'assets/IAM-Identity-Center.svg',
  'sts': 'assets/Identity-and-Access-Management.svg',
  'elasticloadbalancingv2': 'assets/Elastic-Load-Balancing.svg',
  'cloudwatch-logs': 'assets/CloudWatch.svg',
  'cloudwatch-events': 'assets/EventBridge.svg',
  'cloudwatch-synthetics': 'assets/CloudWatch-Synthetics.svg',
  'cloudwatch-rum': 'assets/CloudWatch-RUM.svg',
  'cloudwatch-evidently': 'assets/CloudWatch-Evidently.svg',
  'cloudwatch-internetmonitor': 'assets/CloudWatch-Internet-Monitor.svg',
  'cloudwatch-applicationinsights': 'assets/CloudWatch-Application-Insights.svg',
  'cloudwatch-contributor-insights': 'assets/CloudWatch.svg',
  'cloudwatch-metrics': 'assets/CloudWatch.svg',
  'cloudwatch-dashboards': 'assets/CloudWatch.svg',
  'cloudwatch-alarms': 'assets/CloudWatch.svg',
  'cloudwatch-logs-insights': 'assets/CloudWatch.svg',
  'cloudwatch-metrics-insights': 'assets/CloudWatch.svg',
  'cloudwatch-observability-access-manager': 'assets/CloudWatch.svg',
  'cloudwatch-oam': 'assets/CloudWatch.svg',
  'cloudwatch-logs-delivery': 'assets/CloudWatch.svg',
  'cloudwatch-logs-subscription': 'assets/CloudWatch.svg',
  'cloudwatch-logs-destinations': 'assets/CloudWatch.svg',
  'cloudwatch-logs-export-task': 'assets/CloudWatch.svg',
  'cloudwatch-logs-filter': 'assets/CloudWatch.svg',
  'cloudwatch-logs-insights-query': 'assets/CloudWatch.svg',
  'cloudwatch-logs-log-group': 'assets/CloudWatch.svg',
  'cloudwatch-logs-log-stream': 'assets/CloudWatch.svg',
  'cloudwatch-logs-metric-filter': 'assets/CloudWatch.svg',
  'cloudwatch-logs-resource-policy': 'assets/CloudWatch.svg',
  'cloudwatch-logs-subscription-filter': 'assets/CloudWatch.svg',
  'cloudwatch-logs-destination': 'assets/CloudWatch.svg',
  'cloudwatch-logs-export': 'assets/CloudWatch.svg',
  'cloudwatch-logs-query': 'assets/CloudWatch.svg',
  'cloudwatch-logs-subscription': 'assets/CloudWatch.svg',
  'cloudwatch-logs-delivery': 'assets/CloudWatch.svg',
  'cloudwatch-logs-filter': 'assets/CloudWatch.svg',
  'cloudwatch-logs-insights': 'assets/CloudWatch.svg',
  'cloudwatch-logs-log': 'assets/CloudWatch.svg',
  'cloudwatch-logs-metric': 'assets/CloudWatch.svg',
  'cloudwatch-logs-policy': 'assets/CloudWatch.svg',
  'cloudwatch-logs-subscription': 'assets/CloudWatch.svg',
  'cloudwatch-logs-destination': 'assets/CloudWatch.svg',
  'cloudwatch-logs-export': 'assets/CloudWatch.svg',
  'cloudwatch-logs-query': 'assets/CloudWatch.svg',
  'cloudwatch-logs-subscription': 'assets/CloudWatch.svg',
  'cloudwatch-logs-delivery': 'assets/CloudWatch.svg',
  'cloudwatch-logs-filter': 'assets/CloudWatch.svg',
  'cloudwatch-logs-insights': 'assets/CloudWatch.svg',
  'cloudwatch-logs-log': 'assets/CloudWatch.svg',
  'cloudwatch-logs-metric': 'assets/CloudWatch.svg',
  'cloudwatch-logs-policy': 'assets/CloudWatch.svg',
  'cloudwatch-logs-subscription': 'assets/CloudWatch.svg',
  'cloudwatch-logs-destination': 'assets/CloudWatch.svg',
  'cloudwatch-logs-export': 'assets/CloudWatch.svg',
  'cloudwatch-logs-query': 'assets/CloudWatch.svg',
  'cloudwatch-logs-subscription': 'assets/CloudWatch.svg',
  'cloudwatch-logs-delivery': 'assets/CloudWatch.svg',
  'cloudwatch-logs-filter': 'assets/CloudWatch.svg',
  'cloudwatch-logs-insights': 'assets/CloudWatch.svg',
  'cloudwatch-logs-log': 'assets/CloudWatch.svg',
  'cloudwatch-logs-metric': 'assets/CloudWatch.svg',
  'cloudwatch-logs-policy': 'assets/CloudWatch.svg',
  'cloudwatch-logs-subscription': 'assets/CloudWatch.svg',
};

// Helper function to get service logo based on IAM action
export function getServiceLogo(action) {
  if (!action) return null;
  
  // Extract service prefix from action (e.g., "s3:GetObject" -> "s3")
  const servicePrefixMatch = action.match(/^([a-zA-Z0-9-]+):/);
  if (servicePrefixMatch && servicePrefixMatch[1]) {
    const servicePrefix = servicePrefixMatch[1].toLowerCase();
    
    // Check for direct match
    if (serviceIcons[servicePrefix]) {
      return serviceIcons[servicePrefix];
    }
  }
  
  return null;
}

// Helper function to get service logo based on resource ARN
export function getResourceLogo(resource) {
  if (!resource) return null;
  
  // Extract service from ARN (e.g., "arn:aws:s3:::bucket-name" -> "s3")
  const arnMatch = resource.match(/arn:aws:([a-zA-Z0-9-]+):/);
  if (arnMatch && arnMatch[1]) {
    const service = arnMatch[1].toLowerCase();
    
    // Check for direct match
    if (serviceIcons[service]) {
      return serviceIcons[service];
    }
  }
  
  // For non-ARN resources, try to match service names in the string
  for (const [service, icon] of Object.entries(serviceIcons)) {
    if (resource.includes(service)) {
      return icon;
    }
  }
  
  return null;
}

// Function to preload all icons for better performance
export function preloadIcons() {
  Object.values(serviceIcons).forEach(iconPath => {
    const img = new Image();
    img.src = iconPath;
  });
}
