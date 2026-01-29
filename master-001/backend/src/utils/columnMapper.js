/**
 * Column Mapper Utility
 * Maps different CSV column name variations to standardized field names
 * Supports: AWS CUR, Azure Export, GCP Billing, FOCUS format
 */

/**
 * Find a column value in a row by checking multiple possible names (case-insensitive)
 */
const findColumnValue = (row, possibleNames) => {
  if (!row || typeof row !== 'object') return null;
  
  const rowKeys = Object.keys(row);
  
  for (const possibleName of possibleNames) {
    // Exact match (case-sensitive)
    if (row[possibleName] !== undefined && row[possibleName] !== null && row[possibleName] !== '') {
      return row[possibleName];
    }
    
    // Case-insensitive match
    const foundKey = rowKeys.find(
      key => key.toLowerCase() === possibleName.toLowerCase()
    );
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
      return row[foundKey];
    }
    
    // Partial match (contains the keyword)
    const foundPartial = rowKeys.find(
      key => key.toLowerCase().includes(possibleName.toLowerCase()) ||
             possibleName.toLowerCase().includes(key.toLowerCase())
    );
    if (foundPartial && row[foundPartial] !== undefined && row[foundPartial] !== null && row[foundPartial] !== '') {
      return row[foundPartial];
    }
  }
  
  return null;
};

/**
 * Get all available columns from the first row
 * Returns the actual column names found, not the values
 */
export const detectColumns = (firstRow) => {
  if (!firstRow || typeof firstRow !== 'object') {
    return {
      cost: null,
      service: null,
      region: null,
      resourceId: null,
      resourceName: null,
      date: null,
      provider: null,
      account: null,
      usage: null,
      discountStatus: null,
      allColumns: []
    };
  }

  const allColumns = Object.keys(firstRow);

  return {
    // Cost columns (priority order) - returns column name
    cost: getColumnName(firstRow, [
      'BilledCost', 'Cost', 'Amount', 'Charges', 'TotalCost',
      'UnblendedCost', 'BlendedCost', 'LineItem/UnblendedCost',
      'CostInBillingCurrency', 'PreTaxCost', 'CostUSD'
    ]),
    
    // Service/Product columns
    service: getColumnName(firstRow, [
      'ServiceName', 'Product', 'Service', 'ProductName',
      'LineItem/ProductCode', 'MeterCategory', 'Service'
    ]),
    
    // Region columns
    region: getColumnName(firstRow, [
      'RegionName', 'Region', 'Location', 'AvailabilityZone',
      'LineItem/AvailabilityZone', 'ResourceLocation', 'Zone'
    ]),
    
    // Resource ID columns
    resourceId: getColumnName(firstRow, [
      'ResourceId', 'ResourceIdentifier', 'LineItem/ResourceId',
      'InstanceId', 'ResourceGuid'
    ]),
    
    // Resource Name columns
    resourceName: getColumnName(firstRow, [
      'ResourceName', 'ResourceDescription', 'ItemDescription',
      'DisplayName'
    ]),
    
    // Date columns
    date: getColumnName(firstRow, [
      'BillingPeriodStart', 'UsageStartDate', 'Date', 'UsageDate',
      'LineItem/UsageStartDate', 'BillingPeriodStartDate', 'UsageDateTime'
    ]),
    
    // Provider columns
    provider: getColumnName(firstRow, [
      'ProviderName', 'Provider', 'CloudProvider', 'PayerAccountName',
      'BillingAccountName', 'Cloud'
    ]),
    
    // Account columns
    account: getColumnName(firstRow, [
      'SubAccountName', 'AccountName', 'AccountId', 'PayerAccountId',
      'LinkedAccountId', 'BillingAccountId', 'SubscriptionId'
    ]),
    
    // Usage columns
    usage: getColumnName(firstRow, [
      'UsageQuantity', 'Quantity', 'Usage', 'ConsumedQuantity',
      'LineItem/UsageAmount', 'Amount'
    ]),
    
    // Discount/Commitment columns
    discountStatus: getColumnName(firstRow, [
      'CommitmentDiscountStatus', 'ReservationId', 'SavingsPlanId',
      'DiscountType', 'PricingModel'
    ]),
    
    // All available columns
    allColumns: allColumns
  };
};

/**
 * Get the actual column name from a row (for reference)
 */
export const getColumnName = (row, possibleNames) => {
  if (!row || typeof row !== 'object') return null;
  
  const rowKeys = Object.keys(row);
  
  for (const possibleName of possibleNames) {
    if (row[possibleName] !== undefined) {
      return possibleName;
    }
    
    const foundKey = rowKeys.find(
      key => key.toLowerCase() === possibleName.toLowerCase()
    );
    if (foundKey) return foundKey;
    
    const foundPartial = rowKeys.find(
      key => key.toLowerCase().includes(possibleName.toLowerCase()) ||
             possibleName.toLowerCase().includes(key.toLowerCase())
    );
    if (foundPartial) return foundPartial;
  }
  
  return null;
};

/**
 * Extract value from row using detected column mapping
 */
export const extractValue = (row, columnMapping, field) => {
  if (!row || !columnMapping) return null;
  
  switch (field) {
    case 'cost':
      return columnMapping.cost !== null ? row[columnMapping.cost] : null;
    case 'service':
      return columnMapping.service !== null ? row[columnMapping.service] : null;
    case 'region':
      return columnMapping.region !== null ? row[columnMapping.region] : null;
    case 'resourceId':
      return columnMapping.resourceId !== null ? row[columnMapping.resourceId] : null;
    case 'resourceName':
      return columnMapping.resourceName !== null ? row[columnMapping.resourceName] : null;
    case 'date':
      return columnMapping.date !== null ? row[columnMapping.date] : null;
    case 'provider':
      return columnMapping.provider !== null ? row[columnMapping.provider] : null;
    case 'account':
      return columnMapping.account !== null ? row[columnMapping.account] : null;
    case 'usage':
      return columnMapping.usage !== null ? row[columnMapping.usage] : null;
    case 'discountStatus':
      return columnMapping.discountStatus !== null ? row[columnMapping.discountStatus] : null;
    default:
      return null;
  }
};

/**
 * Normalize row data using column mapping
 * Returns standardized object with consistent field names
 */
export const normalizeRow = (row, columnMapping) => {
  if (!row) return row;
  
  // If column mapping is provided, use it directly
  if (columnMapping) {
    const normalized = {
      ...row, // Keep all original fields
      // Standardized fields (for backward compatibility)
      BilledCost: columnMapping.cost ? (row[columnMapping.cost] || '0') : (row.BilledCost || row.Cost || '0'),
      ServiceName: columnMapping.service ? (row[columnMapping.service] || 'Unknown') : (row.ServiceName || row.Product || 'Unknown'),
      RegionName: columnMapping.region ? (row[columnMapping.region] || 'Global') : (row.RegionName || row.Region || 'Global'),
      ResourceId: columnMapping.resourceId ? (row[columnMapping.resourceId] || null) : (row.ResourceId || row.ResourceName || null),
      ResourceName: columnMapping.resourceName ? (row[columnMapping.resourceName] || null) : (row.ResourceName || row.ItemDescription || null),
      BillingPeriodStart: columnMapping.date ? (row[columnMapping.date] || null) : (row.BillingPeriodStart || row.UsageStartDate || row.Date || null),
      ProviderName: columnMapping.provider ? (row[columnMapping.provider] || 'Unknown') : (row.ProviderName || row.Provider || 'Unknown'),
      SubAccountName: columnMapping.account ? (row[columnMapping.account] || null) : (row.SubAccountName || row.AccountName || null),
      UsageQuantity: columnMapping.usage ? (row[columnMapping.usage] || '0') : (row.UsageQuantity || row.Quantity || '0'),
      CommitmentDiscountStatus: columnMapping.discountStatus ? (row[columnMapping.discountStatus] || '') : (row.CommitmentDiscountStatus || '')
    };
    
    return normalized;
  }
  
  // Fallback: detect columns from row itself
  const costCol = getColumnName(row, [
    'BilledCost', 'Cost', 'Amount', 'Charges', 'TotalCost',
    'UnblendedCost', 'BlendedCost', 'LineItem/UnblendedCost',
    'CostInBillingCurrency', 'PreTaxCost', 'CostUSD'
  ]);
  
  const serviceCol = getColumnName(row, [
    'ServiceName', 'Product', 'Service', 'ProductName',
    'LineItem/ProductCode', 'MeterCategory'
  ]);
  
  const regionCol = getColumnName(row, [
    'RegionName', 'Region', 'Location', 'AvailabilityZone',
    'LineItem/AvailabilityZone', 'ResourceLocation'
  ]);
  
  const resourceIdCol = getColumnName(row, [
    'ResourceId', 'ResourceIdentifier', 'LineItem/ResourceId',
    'InstanceId', 'ResourceGuid'
  ]);
  
  const resourceNameCol = getColumnName(row, [
    'ResourceName', 'ResourceDescription', 'ItemDescription',
    'DisplayName'
  ]);
  
  const dateCol = getColumnName(row, [
    'BillingPeriodStart', 'UsageStartDate', 'Date', 'UsageDate',
    'LineItem/UsageStartDate', 'BillingPeriodStartDate'
  ]);
  
  const providerCol = getColumnName(row, [
    'ProviderName', 'Provider', 'CloudProvider', 'PayerAccountName',
    'BillingAccountName'
  ]);
  
  const accountCol = getColumnName(row, [
    'SubAccountName', 'AccountName', 'AccountId', 'PayerAccountId',
    'LinkedAccountId', 'BillingAccountId', 'SubscriptionId'
  ]);
  
  const usageCol = getColumnName(row, [
    'UsageQuantity', 'Quantity', 'Usage', 'ConsumedQuantity',
    'LineItem/UsageAmount'
  ]);
  
  const discountCol = getColumnName(row, [
    'CommitmentDiscountStatus', 'ReservationId', 'SavingsPlanId',
    'DiscountType', 'PricingModel'
  ]);
  
  // Create normalized object with both original and standardized fields
  const normalized = {
    ...row, // Keep all original fields
    // Standardized fields (for backward compatibility)
    BilledCost: costCol ? row[costCol] : (row.BilledCost || row.Cost || '0'),
    ServiceName: serviceCol ? row[serviceCol] : (row.ServiceName || row.Product || 'Unknown'),
    RegionName: regionCol ? row[regionCol] : (row.RegionName || row.Region || 'Global'),
    ResourceId: resourceIdCol ? row[resourceIdCol] : (row.ResourceId || row.ResourceName || null),
    ResourceName: resourceNameCol ? row[resourceNameCol] : (row.ResourceName || row.ItemDescription || null),
    BillingPeriodStart: dateCol ? row[dateCol] : (row.BillingPeriodStart || row.UsageStartDate || row.Date || null),
    ProviderName: providerCol ? row[providerCol] : (row.ProviderName || row.Provider || 'Unknown'),
    SubAccountName: accountCol ? row[accountCol] : (row.SubAccountName || row.AccountName || null),
    UsageQuantity: usageCol ? row[usageCol] : (row.UsageQuantity || row.Quantity || '0'),
    CommitmentDiscountStatus: discountCol ? row[discountCol] : (row.CommitmentDiscountStatus || '')
  };
  
  return normalized;
};

