import { detectColumns, normalizeRow } from './columnMapper.js';

export const processRecords = (records) => {
  if (!records || records.length === 0) {
    return {
      totalSpend: '0.00',
      leakageCost: '0.00',
      efficiencyScore: 100,
      timelineGraph: [],
      productEarnings: [],
      leakageItems: [],
      recordCount: 0,
      rawRecords: [],
      columnMapping: null
    };
  }

  // Detect column mapping from first row
  const columnMapping = detectColumns(records[0]);
  
  let totalSpend = 0;
  let leakageCost = 0;
  const timelineMap = {};
  const serviceMap = {};
  const regionMap = {};
  const leakageItems = [];

  records.forEach((row, index) => {
    try {
      // Normalize row to have consistent field names
      const normalizedRow = normalizeRow(row, columnMapping);
      
      // 1. Safe Parse Cost (Handle currency symbols or commas if present)
      // Use normalized BilledCost field (which maps to any cost column)
      let rawCost = normalizedRow.BilledCost || normalizedRow.Cost || '0';
      if (typeof rawCost === 'string') {
        rawCost = rawCost.replace(/[$,]/g, '');
      }
      const cost = parseFloat(rawCost) || 0;

      // 2. Aggregate Total Spend
      totalSpend += cost;

      // 3. Leakage Logic (If CommitmentDiscountStatus is missing/uncovered)
      const discountStatus = normalizedRow.CommitmentDiscountStatus || '';
      const isOptimized = discountStatus.toLowerCase().includes('used') || 
                          discountStatus.toLowerCase().includes('covered') ||
                          discountStatus.toLowerCase().includes('reserved') ||
                          discountStatus.toLowerCase().includes('savings');
      
      if (!isOptimized && cost > 0.0001) { 
        leakageCost += cost;
        
        if (leakageItems.length < 100) {
           leakageItems.push({
             name: normalizedRow.ResourceName || normalizedRow.ResourceId || normalizedRow.ServiceName || 'Unknown Resource',
             service: normalizedRow.ServiceName || 'Unknown Service',
             region: normalizedRow.RegionName || 'Global',
             cost: cost,
             CommitmentDiscountStatus: 'Uncovered'
           });
        }
      }

      // 4. Timeline (Daily Spend) - Safe Date Parsing
      const dateStr = normalizedRow.BillingPeriodStart || normalizedRow.UsageStartDate || normalizedRow.Date;
      if (dateStr) {
        // Take the YYYY-MM-DD part safely
        const date = String(dateStr).split(' ')[0].split('T')[0]; 
        if (date && date.match(/^\d{4}-\d{2}-\d{2}/)) {
          timelineMap[date] = (timelineMap[date] || 0) + cost;
        }
      }

      // 5. Service Breakdown
      const service = normalizedRow.ServiceName || normalizedRow.Product || 'Other';
      serviceMap[service] = (serviceMap[service] || 0) + cost;
      
      // 6. Region Breakdown
      const region = normalizedRow.RegionName || normalizedRow.Region || 'Global';
      regionMap[region] = (regionMap[region] || 0) + cost;

    } catch (err) {
      console.warn(`Skipping row ${index} due to error:`, err.message);
    }
  });

  // --- FORMAT FOR FRONTEND ---
  
  // A. Timeline
  const timelineGraph = Object.keys(timelineMap).sort().map(date => ({
    date,
    cost: parseFloat(timelineMap[date].toFixed(2))
  }));

  // B. Top Services
  const productEarnings = Object.entries(serviceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // C. Efficiency Score
  const efficiencyScore = totalSpend > 0 
    ? Math.round(((totalSpend - leakageCost) / totalSpend) * 100) 
    : 100;

  // Normalize all raw records before returning
  const normalizedRecords = records.slice(0, 1000).map(row => normalizeRow(row, columnMapping));

  return {
    totalSpend: totalSpend.toFixed(2),
    leakageCost: leakageCost.toFixed(2),
    efficiencyScore,
    timelineGraph,
    productEarnings,
    leakageItems,
    recordCount: records.length,
    rawRecords: normalizedRecords, // Normalized records with consistent field names
    columnMapping: columnMapping // Include mapping info for frontend reference
  };
};