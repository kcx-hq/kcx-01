/**
 * Date Helpers for FinOps
 * Centralized date manipulation utilities for cost analysis
 */

/**
 * Get date range for cost queries
 * @param {string} period - 'month', 'week', 'year', or custom days
 * @returns {Object} { startDate, endDate }
 */
export function getDateRange(period = null) {
  if (!period) return { startDate: null, endDate: null };
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // End of today
  
  let startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(startDate.getFullYear(), 0, 1);
      break;
    case 'last30days':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'last90days':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      // Assume it's a number of days
      const days = parseInt(period, 10);
      if (!isNaN(days)) {
        startDate.setDate(startDate.getDate() - days);
      } else {
        startDate.setDate(startDate.getDate() - 30); // Default to 30 days
      }
  }
  
  startDate.setHours(0, 0, 0, 0); // Start of day
  
  return { startDate, endDate };
}

/**
 * Format date for billing period display
 * @param {Date} date - Date to format
 * @returns {string} Formatted string like "Jan 2024"
 */
export function formatBillingPeriod(date) {
  if (!date) return null;
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(date);
  return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Get billing period from daily data
 * @param {Array} dailyData - Array of { date, cost } objects
 * @returns {string|null} Billing period string or null
 */
export function getBillingPeriodFromData(dailyData) {
  if (!dailyData || dailyData.length === 0) return null;
  
  const dates = dailyData
    .map(d => {
      try {
        return new Date(d.date);
      } catch {
        return null;
      }
    })
    .filter(d => d && !isNaN(d.getTime()));
  
  if (dates.length === 0) return null;
  
  const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
  return formatBillingPeriod(latestDate);
}

/**
 * Calculate period-over-period change
 * @param {number} currentPeriod - Current period total
 * @param {number} previousPeriod - Previous period total
 * @returns {number} Percentage change
 */
export function calculatePeriodChange(currentPeriod, previousPeriod) {
  if (!previousPeriod || previousPeriod === 0) return 0;
  return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
}

/**
 * Group dates by month for monthly aggregation
 * @param {Date} date - Date to extract month from
 * @returns {string} YYYY-MM format
 */
export function getMonthKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Check if date is within range
 * @param {Date} date - Date to check
 * @param {Date} startDate - Range start
 * @param {Date} endDate - Range end
 * @returns {boolean}
 */
export function isDateInRange(date, startDate, endDate) {
  const d = new Date(date);
  return d >= startDate && d <= endDate;
}








