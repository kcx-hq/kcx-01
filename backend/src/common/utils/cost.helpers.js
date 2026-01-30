/**
 * Cost Calculation Helpers
 * Reusable cost calculation and formatting utilities
 */

/**
 * Calculate percentage of total
 * @param {number} value - Part value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export function calculatePercentage(value, total) {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Format currency value
 * @param {number} value - Cost value
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {number} Formatted value
 */
export function formatCurrency(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return parseFloat(parseFloat(value).toFixed(decimals));
}

/**
 * Calculate average daily spend
 * @param {number} totalSpend - Total spend
 * @param {number} days - Number of days
 * @returns {number} Average daily spend
 */
export function calculateAverageDailySpend(totalSpend, days) {
  if (!days || days === 0) return 0;
  return formatCurrency(totalSpend / days);
}

/**
 * Calculate forecast based on current spend
 * @param {number} currentSpend - Current period spend
 * @param {number} multiplier - Forecast multiplier (default: 1.15)
 * @returns {number} Forecasted spend
 */
export function calculateForecast(currentSpend, multiplier = 1.15) {
  return formatCurrency(currentSpend * multiplier);
}

/**
 * Detect cost anomalies using statistical methods
 * @param {Array<number>} costs - Array of cost values
 * @param {number} sigmaThreshold - Standard deviation threshold (default: 2)
 * @returns {Object} { mean, stdDev, threshold, anomalies }
 */
export function detectAnomalies(costs, sigmaThreshold = 2) {
  if (!costs || costs.length === 0) {
    return { mean: 0, stdDev: 0, threshold: 0, anomalies: [] };
  }
  
  // Calculate mean
  const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
  
  // Calculate standard deviation
  const variance = costs.reduce((sum, cost) => {
    return sum + Math.pow(cost - mean, 2);
  }, 0) / costs.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate threshold
  const threshold = mean + (sigmaThreshold * stdDev);
  
  // Find anomalies (values exceeding threshold)
  const anomalies = costs
    .map((cost, index) => ({ cost, index }))
    .filter(item => item.cost > threshold)
    .map(item => item.index);
  
  return {
    mean: formatCurrency(mean),
    stdDev: formatCurrency(stdDev),
    threshold: formatCurrency(threshold),
    anomalies
  };
}

/**
 * Calculate tagged vs untagged cost percentages
 * @param {number} taggedCost - Cost of tagged resources
 * @param {number} totalCost - Total cost
 * @returns {Object} { taggedPercent, untaggedPercent, taggedCost, untaggedCost }
 */
export function calculateTagCompliance(taggedCost, totalCost) {
  const taggedPercent = calculatePercentage(taggedCost, totalCost);
  const untaggedPercent = 100 - taggedPercent;
  const untaggedCost = totalCost - taggedCost;
  
  return {
    taggedPercent: formatCurrency(taggedPercent, 2),
    untaggedPercent: formatCurrency(untaggedPercent, 2),
    taggedCost: formatCurrency(taggedCost),
    untaggedCost: formatCurrency(untaggedCost)
  };
}

/**
 * Check if resource is tagged (has required tags)
 * @param {Object} tags - Tags object from database
 * @param {Array<string>} requiredTags - Required tag keys
 * @returns {boolean} True if all required tags present
 */
export function isResourceTagged(tags, requiredTags = []) {
  if (!tags || typeof tags !== 'object') return false;
  if (requiredTags.length === 0) return Object.keys(tags).length > 0;
  
  return requiredTags.every(tag => 
    tags[tag] && String(tags[tag]).trim() !== ''
  );
}

/**
 * Classify environment from tags
 * @param {Object} tags - Tags object
 * @param {Array<string>} prodEnvs - Production environment identifiers
 * @param {Array<string>} nonProdEnvs - Non-production environment identifiers
 * @returns {string} 'prod', 'non-prod', or 'unknown'
 */
export function classifyEnvironment(tags, prodEnvs = [], nonProdEnvs = []) {
  if (!tags || typeof tags !== 'object') return 'unknown';
  
  const envTag = tags.Environment || tags.environment || tags.ENV || tags.env || '';
  const envLower = String(envTag).toLowerCase();
  
  if (prodEnvs.some(env => envLower.includes(env))) return 'prod';
  if (nonProdEnvs.some(env => envLower.includes(env))) return 'non-prod';
  
  return 'unknown';
}

/**
 * Calculate cost distribution by category
 * @param {Array} items - Array of { name, value } objects
 * @param {number} total - Total cost
 * @returns {Array} Items with percentage added
 */
export function addPercentagesToDistribution(items, total) {
  return items.map(item => ({
    ...item,
    percentage: calculatePercentage(item.value, total)
  }));
}








