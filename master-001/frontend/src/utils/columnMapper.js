/**
 * Frontend Column Mapper Utility
 * Maps different CSV column name variations to standardized field names
 * Works with backend column mapping to ensure consistency
 */

/**
 * Find a column in a row by checking multiple possible names (case-insensitive)
 */
const findColumn = (row, possibleNames) => {
  if (!row || typeof row !== 'object') return null;
  
  const rowKeys = Object.keys(row);
  
  for (const possibleName of possibleNames) {
    // Exact match (case-sensitive)
    if (row[possibleName] !== undefined && row[possibleName] !== null) {
      return row[possibleName];
    }
    
    // Case-insensitive match
    const foundKey = rowKeys.find(
      key => key.toLowerCase() === possibleName.toLowerCase()
    );
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      return row[foundKey];
    }
    
    // Partial match (contains the keyword)
    const foundPartial = rowKeys.find(
      key => key.toLowerCase().includes(possibleName.toLowerCase()) ||
             possibleName.toLowerCase().includes(key.toLowerCase())
    );
    if (foundPartial && row[foundPartial] !== undefined && row[foundPartial] !== null) {
      return row[foundPartial];
    }
  }
  
  return null;
};

/**
 * Get cost value from a row (handles multiple column name variations)
 */
export const getCost = (row) => {
  const costValue = findColumn(row, [
    'BilledCost', 'Cost', 'Amount', 'Charges', 'TotalCost',
    'UnblendedCost', 'BlendedCost', 'LineItem/UnblendedCost',
    'CostInBillingCurrency', 'PreTaxCost', 'CostUSD'
  ]);
  
  if (costValue === null || costValue === undefined) return 0;
  
  let rawCost = String(costValue);
  rawCost = rawCost.replace(/[$,]/g, '');
  return parseFloat(rawCost) || 0;
};

/**
 * Get service name from a row
 */
export const getService = (row) => {
  return findColumn(row, [
    'ServiceName', 'Product', 'Service', 'ProductName',
    'LineItem/ProductCode', 'MeterCategory'
  ]) || 'Unknown';
};

/**
 * Get region from a row
 */
export const getRegion = (row) => {
  return findColumn(row, [
    'RegionName', 'Region', 'Location', 'AvailabilityZone',
    'LineItem/AvailabilityZone', 'ResourceLocation', 'Zone'
  ]) || 'Global';
};

/**
 * Get resource ID from a row
 */
export const getResourceId = (row) => {
  return findColumn(row, [
    'ResourceId', 'ResourceIdentifier', 'LineItem/ResourceId',
    'InstanceId', 'ResourceGuid'
  ]) || null;
};

/**
 * Get resource name from a row
 */
export const getResourceName = (row) => {
  return findColumn(row, [
    'ResourceName', 'ResourceDescription', 'ItemDescription',
    'DisplayName'
  ]) || null;
};

/**
 * Get date from a row
 */
export const getDate = (row) => {
  return findColumn(row, [
    'BillingPeriodStart', 'UsageStartDate', 'Date', 'UsageDate',
    'LineItem/UsageStartDate', 'BillingPeriodStartDate', 'UsageDateTime'
  ]) || null;
};

/**
 * Get provider from a row
 */
export const getProvider = (row) => {
  return findColumn(row, [
    'ProviderName', 'Provider', 'CloudProvider', 'PayerAccountName',
    'BillingAccountName', 'Cloud'
  ]) || 'Unknown';
};

/**
 * Get account from a row
 */
export const getAccount = (row) => {
  return findColumn(row, [
    'SubAccountName', 'AccountName', 'AccountId', 'PayerAccountId',
    'LinkedAccountId', 'BillingAccountId', 'SubscriptionId'
  ]) || null;
};

/**
 * Get usage quantity from a row
 */
export const getUsage = (row) => {
  const usageValue = findColumn(row, [
    'UsageQuantity', 'Quantity', 'Usage', 'ConsumedQuantity',
    'LineItem/UsageAmount', 'Amount'
  ]);
  
  if (usageValue === null || usageValue === undefined) return 0;
  return parseFloat(usageValue) || 0;
};

/**
 * Get discount/commitment status from a row
 */
export const getDiscountStatus = (row) => {
  return findColumn(row, [
    'CommitmentDiscountStatus', 'ReservationId', 'SavingsPlanId',
    'DiscountType', 'PricingModel'
  ]) || '';
};

/**
 * Normalize a row to have consistent field names
 * This ensures backward compatibility with existing code
 */
export const normalizeRow = (row) => {
  if (!row || typeof row !== 'object') return row;
  
  // If row already has normalized fields (from backend), use them
  if (row.BilledCost !== undefined && row.ServiceName !== undefined) {
    return row;
  }
  
  // Otherwise, normalize using dynamic detection
  return {
    ...row, // Keep all original fields
    // Add normalized fields for backward compatibility
    BilledCost: getCost(row),
    ServiceName: getService(row),
    RegionName: getRegion(row),
    ResourceId: getResourceId(row),
    ResourceName: getResourceName(row),
    BillingPeriodStart: getDate(row),
    ProviderName: getProvider(row),
    SubAccountName: getAccount(row),
    UsageQuantity: getUsage(row),
    CommitmentDiscountStatus: getDiscountStatus(row)
  };
};

/**
 * Get all available columns from data
 */
export const getAllColumns = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) return [];
  
  const allColumns = new Set();
  data.forEach(row => {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach(key => {
        if (key && !key.startsWith('_')) { // Exclude internal fields
          allColumns.add(key);
        }
      });
    }
  });
  
  return Array.from(allColumns).sort();
};

/**
 * Find cost column name in data
 */
export const findCostColumn = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) return 'BilledCost';
  
  const firstRow = data[0];
  if (!firstRow) return 'BilledCost';
  
  const possibleNames = [
    'BilledCost', 'Cost', 'Amount', 'Charges', 'TotalCost',
    'UnblendedCost', 'BlendedCost', 'LineItem/UnblendedCost',
    'CostInBillingCurrency', 'PreTaxCost', 'CostUSD'
  ];
  
  for (const name of possibleNames) {
    if (firstRow[name] !== undefined) return name;
    
    const found = Object.keys(firstRow).find(
      key => key.toLowerCase() === name.toLowerCase()
    );
    if (found) return found;
  }
  
  return 'BilledCost'; // Default fallback
};

