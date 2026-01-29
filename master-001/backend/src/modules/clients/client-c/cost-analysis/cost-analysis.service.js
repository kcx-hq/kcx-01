/**
 * Client-C Cost Analysis Service
 * Modified: Add department grouping, remove risk/volatility analysis
 */

import { generateCostAnalysis as coreCostAnalysis, getFilterDropdowns } from '../../../../modules/core-dashboard/analytics/cost-analysis/cost-analysis.service.js';
import { BillingUsageFact, Service, Region, CloudAccount } from '../../../../models/index.js';
import { Op } from 'sequelize';
import Sequelize from '../../../../config/db.config.js';

/**
 * Extract department from tags
 */
function extractDepartment(tags) {
  if (!tags || typeof tags !== 'object') return 'Untagged';
  return tags.department || tags.Department || 'Untagged';
}

/**
 * Generate cost analysis by department
 */
async function analyzeCostByDepartment(filters = {}, uploadIds = []) {
  const { provider, service, region } = filters?.filters || filters;
  
  if (!uploadIds || uploadIds.length === 0) {
    return {
      chartData: [],
      breakdown: [],
      activeKeys: [],
    };
  }

  const whereClause = {
    uploadid: { [Op.in]: uploadIds },
  };

  const include = [
    {
      model: CloudAccount,
      as: 'cloudAccount',
      required: provider && provider !== 'All',
      attributes: [],
      ...(provider && provider !== 'All' ? { where: { providername: provider } } : {}),
    },
    {
      model: Service,
      as: 'service',
      required: service && service !== 'All',
      attributes: [],
      ...(service && service !== 'All' ? { where: { servicename: service } } : {}),
    },
    {
      model: Region,
      as: 'region',
      required: region && region !== 'All',
      attributes: [],
      ...(region && region !== 'All' ? { where: { regionname: region } } : {}),
    },
  ];

  // Fetch all records
  const records = await BillingUsageFact.findAll({
    where: whereClause,
    include,
    attributes: ['tags', 'billedcost', 'chargeperiodstart'],
    order: [['chargeperiodstart', 'ASC']],
    raw: true,
  });

  if (records.length === 0) {
    return {
      chartData: [],
      breakdown: [],
      activeKeys: [],
    };
  }

  // Group by department and date
  const dailyDeptMap = {};
  const departmentTotals = {};

  records.forEach(record => {
    const department = extractDepartment(record.tags);
    const cost = parseFloat(record.billedcost || 0);
    const date = record.chargeperiodstart
      ? new Date(record.chargeperiodstart).toISOString().split('T')[0]
      : 'Unknown';

    // Daily tracking
    if (!dailyDeptMap[date]) {
      dailyDeptMap[date] = { date, total: 0 };
    }
    dailyDeptMap[date][department] = (dailyDeptMap[date][department] || 0) + cost;
    dailyDeptMap[date].total += cost;

    // Totals
    departmentTotals[department] = (departmentTotals[department] || 0) + cost;
  });

  // Convert to array
  const chartData = Object.values(dailyDeptMap).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  const breakdown = Object.entries(departmentTotals)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  const activeKeys = breakdown.map(b => b.name);

  return {
    chartData,
    breakdown,
    activeKeys,
  };
}

/**
 * Client-C Cost Analysis - Modified version
 */
export const generateClientCCostAnalysis = async (filters = {}, groupBy) => {
  console.log('🔎 generateClientCCostAnalysis called with:', { filters, groupBy });
  
  const uploadIds = Array.isArray(filters.uploadIds) 
    ? filters.uploadIds 
    : filters.uploadId 
    ? [filters.uploadId] 
    : [];

  console.log('📊 Extracted uploadIds:', uploadIds);

  if (uploadIds.length === 0) {
    console.warn('⚠️ No uploadIds provided, returning empty data');
    return {
      kpis: {
        totalSpend: 0,
        avgDaily: 0,
        peakUsage: 0,
        peakDate: null,
        trend: 0,
        forecastTotal: 0,
        atRiskSpend: 0,
      },
      chartData: [],
      predictabilityChartData: [],
      anomalies: [],
      activeKeys: [],
      drivers: [],
      riskData: [],
      breakdown: [],
      message: 'No upload selected. Please select a billing upload to analyze cost.'
    };
  }

  // If grouping by department, use custom logic
  if (groupBy === 'Department') {
    console.log('🏷️ Using Department grouping logic');
    const deptAnalysis = await analyzeCostByDepartment(filters, uploadIds);
    
    const totalSpend = deptAnalysis.breakdown.reduce((sum, b) => sum + b.value, 0);
    const avgDaily = deptAnalysis.chartData.length > 0 
      ? totalSpend / deptAnalysis.chartData.length 
      : 0;

    const peakDay = deptAnalysis.chartData.reduce(
      (max, d) => (d.total > max.total ? d : max),
      { total: 0, date: null }
    );

    return {
      kpis: {
        totalSpend: parseFloat(totalSpend.toFixed(2)),
        avgDaily: parseFloat(avgDaily.toFixed(2)),
        peakUsage: parseFloat(peakDay.total.toFixed(2)),
        peakDate: peakDay.date,
        forecastTotal: 0, // Not supported in Client-C
        atRiskSpend: 0, // Removed in Client-C
      },
      chartData: deptAnalysis.chartData,
      predictabilityChartData: deptAnalysis.chartData, // No forecast
      anomalies: [], // Simplified
      activeKeys: deptAnalysis.activeKeys,
      drivers: [], // Will be handled by cost-drivers module
      riskData: [], // Removed in Client-C
      breakdown: deptAnalysis.breakdown,
    };
  }

  // For other groupings, use core logic but remove risk data
  console.log('🔧 Using core cost analysis logic with filters:', filters);
  const coreResult = await coreCostAnalysis(filters, groupBy);
  console.log('✅ Core analysis result:', {
    totalSpend: coreResult?.kpis?.totalSpend,
    chartDataLength: coreResult?.chartData?.length,
    breakdownLength: coreResult?.breakdown?.length
  });

  return {
    ...coreResult,
    riskData: [], // Remove risk/volatility analysis for Client-C
    predictabilityChartData: coreResult.chartData, // Simplified, no complex forecasting
  };
};

/**
 * Get filter options (reuse core)
 */
export const getClientCFilterDropdowns = async () => {
  const coreFilters = await getFilterDropdowns();
  
  // Add Department option to groupBy choices
  return {
    ...coreFilters,
    groupByOptions: [
      { value: 'ServiceName', label: 'Service' },
      { value: 'RegionName', label: 'Region' },
      { value: 'ProviderName', label: 'Provider' },
      { value: 'Department', label: 'Department' }, // Client-C specific
    ],
  };
};
