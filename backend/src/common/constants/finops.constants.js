/**
 * FinOps Constants
 * Centralized constants for FinOps calculations and business rules
 */

export const FINOPS_CONSTANTS = {
  // Tagging Standards
  REQUIRED_TAGS: ['Environment', 'Owner', 'Project', 'CostCenter'],
  
  // Environment Classification
  PROD_ENVIRONMENTS: ['prod', 'production', 'live'],
  NON_PROD_ENVIRONMENTS: ['dev', 'development', 'staging', 'test', 'qa', 'sandbox'],
  
  // Cost Thresholds
  ANOMALY_THRESHOLD_SIGMA: 2, // Standard deviations for anomaly detection
  IDLE_RESOURCE_THRESHOLD_DAYS: 30, // Days without usage to consider idle
  UNDERUTILIZED_THRESHOLD_PERCENT: 20, // CPU/Memory usage below this is underutilized
  
  // Aggregation Limits
  TOP_SERVICES_LIMIT: 10,
  TOP_REGIONS_LIMIT: 10,
  TOP_RESOURCES_LIMIT: 50,
  
  // Date Ranges
  DEFAULT_DATE_RANGE_DAYS: 30,
  FORECAST_MULTIPLIER: 1.15, // Simple forecast multiplier (can be replaced with ML)
  
  // Governance
  MIN_TAG_COMPLIANCE_PERCENT: 80, // Minimum % of resources that must be tagged
  DATA_QUALITY_MIN_SCORE: 70, // Minimum data quality score
};

/**
 * Cost Categories for FinOps reporting
 */
export const COST_CATEGORIES = {
  COMPUTE: 'Compute',
  STORAGE: 'Storage',
  NETWORK: 'Network',
  DATABASE: 'Database',
  ANALYTICS: 'Analytics',
  SECURITY: 'Security',
  OTHER: 'Other',
};

/**
 * Maps service names to cost categories
 * Used for intelligent categorization in reports
 */
export const SERVICE_CATEGORY_MAP = {
  // AWS
  'EC2': COST_CATEGORIES.COMPUTE,
  'Lambda': COST_CATEGORIES.COMPUTE,
  'ECS': COST_CATEGORIES.COMPUTE,
  'EKS': COST_CATEGORIES.COMPUTE,
  'S3': COST_CATEGORIES.STORAGE,
  'EBS': COST_CATEGORIES.STORAGE,
  'EFS': COST_CATEGORIES.STORAGE,
  'CloudFront': COST_CATEGORIES.NETWORK,
  'Route53': COST_CATEGORIES.NETWORK,
  'RDS': COST_CATEGORIES.DATABASE,
  'DynamoDB': COST_CATEGORIES.DATABASE,
  'Redshift': COST_CATEGORIES.ANALYTICS,
  'Athena': COST_CATEGORIES.ANALYTICS,
  'IAM': COST_CATEGORIES.SECURITY,
  'WAF': COST_CATEGORIES.SECURITY,
  
  // Azure
  'Virtual Machines': COST_CATEGORIES.COMPUTE,
  'Storage Accounts': COST_CATEGORIES.STORAGE,
  'SQL Database': COST_CATEGORIES.DATABASE,
  
  // GCP
  'Compute Engine': COST_CATEGORIES.COMPUTE,
  'Cloud Storage': COST_CATEGORIES.STORAGE,
  'Cloud SQL': COST_CATEGORIES.DATABASE,
};








