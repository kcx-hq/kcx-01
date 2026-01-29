export function normalizeCostAnalysisData(costAnalysisData, groupBy = 'ServiceName') {
  // Handle empty/invalid data
  if (!costAnalysisData || typeof costAnalysisData !== "object") {
    return createEmptyNormalizedData();
  }

  // Handle special empty state message
  if (costAnalysisData.message === "No upload selected. Please select a billing upload to analyze cost.") {
    return {
      ...createEmptyNormalizedData(),
      message: costAnalysisData.message
    };
  }

  // KPIs - Enhanced with defaults and validation
  const kpis = costAnalysisData.kpis || {};
  const totalSpend = validateNumber(kpis.totalSpend, 0);
  const avgDaily = validateNumber(kpis.avgDaily, 0);
  const peakUsage = validateNumber(kpis.peakUsage, 0);
  const peakDate = kpis.peakDate ?? null;
  const trend = validateNumber(kpis.trend, 0);
  const atRiskSpend = validateNumber(kpis.atRiskSpend, 0);
  const forecastTotal = validateNumber(kpis.forecastTotal, 0);
  
  // Enhanced KPI calculations for better insights
  const kpiInsights = {
    spendLevel: getSpendLevel(totalSpend),
    trendDirection: trend >= 0 ? 'increasing' : 'decreasing',
    volatility: Math.abs(trend) > 15 ? 'high' : Math.abs(trend) > 5 ? 'moderate' : 'stable'
  };

  // Chart data processing - Handle different data structures
  let chartData = Array.isArray(costAnalysisData.chartData) ? [...costAnalysisData.chartData] : [];
  
  // Ensure chart data has required structure
  chartData = chartData.map(item => ({
    ...item,
    date: item.date || 'Unknown',
    total: item.total !== undefined ? item.total : (item.value || 0)
  })).filter(item => item.date !== 'Unknown');

  // Active keys - Handle department grouping specially
  let activeKeys = Array.isArray(costAnalysisData.activeKeys) 
    ? [...costAnalysisData.activeKeys] 
    : [];
  
  // If no active keys but we have breakdown data, derive from breakdown
  if (activeKeys.length === 0 && Array.isArray(costAnalysisData.breakdown)) {
    activeKeys = costAnalysisData.breakdown.map(item => item.name || item.label).filter(Boolean);
  }

  // Breakdown data - Enhanced processing
  let breakdown = Array.isArray(costAnalysisData.breakdown) 
    ? [...costAnalysisData.breakdown] 
    : [];
  
  // Ensure breakdown has consistent structure
  breakdown = breakdown.map(item => ({
    name: item.name || item.label || 'Unknown',
    value: validateNumber(item.value, 0),
    label: item.label || item.name || 'Unknown',
    percentage: 0 // Will calculate below
  })).filter(item => item.value > 0);
  
  // Calculate percentages
  const breakdownTotal = breakdown.reduce((sum, item) => sum + item.value, 0);
  if (breakdownTotal > 0) {
    breakdown = breakdown.map(item => ({
      ...item,
      percentage: ((item.value / breakdownTotal) * 100)
    }));
  }
  
  // Sort by value descending
  breakdown.sort((a, b) => b.value - a.value);

  // Risk data (Client-C typically has this removed, but preserve if exists)
  const riskData = Array.isArray(costAnalysisData.riskData) ? [...costAnalysisData.riskData] : [];
  
  // Anomalies (Client-C typically has this removed, but preserve if exists)
  const anomalies = Array.isArray(costAnalysisData.anomalies) ? [...costAnalysisData.anomalies] : [];
  
  // Drivers (Client-C typically handles via separate module, but preserve if exists)
  const drivers = Array.isArray(costAnalysisData.drivers) ? [...costAnalysisData.drivers] : [];

  // Enhanced metadata
  const metadata = {
    groupBy: groupBy || 'ServiceName',
    dataPoints: chartData.length,
    categories: breakdown.length,
    totalProcessed: breakdownTotal,
    hasValidData: totalSpend > 0 && chartData.length > 0,
    isEmptyState: totalSpend === 0 && chartData.length === 0
  };

  return {
    // Core data
    kpis: {
      totalSpend,
      avgDaily,
      peakUsage,
      peakDate,
      trend,
      atRiskSpend,
      forecastTotal,
      ...kpiInsights
    },
    chartData,
    activeKeys,
    breakdown,
    riskData,
    anomalies,
    drivers,
    
    // Convenience accessors
    totalSpend,
    avgDaily,
    peakUsage,
    peakDate,
    trend,
    atRiskSpend,
    forecastTotal,
    
    // Enhanced metadata
    metadata,
    
    // Preserve original message if exists
    message: costAnalysisData.message
  };
}

// Helper functions
function validateNumber(value, defaultValue = 0) {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

function getSpendLevel(amount) {
  if (amount >= 100000) return 'enterprise';
  if (amount >= 50000) return 'high';
  if (amount >= 10000) return 'moderate';
  if (amount >= 1000) return 'low';
  return 'minimal';
}

function createEmptyNormalizedData() {
  return {
    kpis: {
      totalSpend: 0,
      avgDaily: 0,
      peakUsage: 0,
      peakDate: null,
      trend: 0,
      atRiskSpend: 0,
      forecastTotal: 0,
      spendLevel: 'minimal',
      trendDirection: 'stable',
      volatility: 'stable'
    },
    chartData: [],
    activeKeys: [],
    breakdown: [],
    riskData: [],
    anomalies: [],
    drivers: [],
    totalSpend: 0,
    avgDaily: 0,
    peakUsage: 0,
    peakDate: null,
    trend: 0,
    atRiskSpend: 0,
    forecastTotal: 0,
    metadata: {
      groupBy: 'ServiceName',
      dataPoints: 0,
      categories: 0,
      totalProcessed: 0,
      hasValidData: false,
      isEmptyState: true
    }
  };
}