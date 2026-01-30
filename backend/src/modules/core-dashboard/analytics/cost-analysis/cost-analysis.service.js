import { costAnalysisRepository } from './cost-analysis.repository.js';
import { calculateCostDrivers } from '../cost-drivers/cost-drivers.service.js';
import { BillingUsageFact, Resource, Service, Region, CloudAccount } from '../../../../models/index.js';
import { Op } from 'sequelize';

/* ===================== CONSTANTS ===================== */
const CHART_MAX_SERIES = 7;

/* ===================== HELPERS ===================== */

const normalizeUploadIds = (input = {}) => {
  if (Array.isArray(input.uploadIds)) return input.uploadIds;
  if (input.uploadIds) return [input.uploadIds];
  if (input.uploadId) return [input.uploadId];
  return [];
};

/* --- HELPER 1: Fill Date Gaps --- */
const fillDateGaps = (chartData) => {
  if (!chartData || chartData.length === 0) return [];

  chartData.sort((a, b) => new Date(a.date) - new Date(b.date));

  const filledData = [];
  const startDate = new Date(chartData[0].date);
  const endDate = new Date(chartData[chartData.length - 1].date);

  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) return chartData;

  const dataMap = new Map(chartData.map(d => [d.date, d]));

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    filledData.push(
      dataMap.get(dateStr) || { date: dateStr, total: 0 }
    );
  }

  return filledData;
};

/* --- HELPER 2: Forecast --- */
const calculateForecastWithRange = (data, daysToProject = 30) => {
  if (!data || data.length < 2) return [];

  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  data.forEach((d, i) => {
    const val = d.total || 0;
    sumX += i;
    sumY += val;
    sumXY += i * val;
    sumXX += i * i;
  });

  const denominator = (n * sumXX - sumX * sumX);
  if (denominator === 0) return [];

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const lastDate = new Date(data[n - 1].date);
  const lastValue = data[n - 1].total;

  const forecast = [{
    date: data[n - 1].date,
    actual: null,
    forecast: lastValue,
    range: [lastValue, lastValue],
    type: 'bridge'
  }];

  for (let i = 1; i <= daysToProject; i++) {
    const date = new Date(lastDate);
    date.setDate(lastDate.getDate() + i);

    const prediction = Math.max(0, slope * (n - 1 + i) + intercept);
    const deviation = prediction * (0.05 + i * 0.005);

    forecast.push({
      date: date.toISOString().split('T')[0],
      actual: null,
      forecast: prediction,
      range: [Math.max(0, prediction - deviation), prediction + deviation],
      type: 'future'
    });
  }

  return forecast;
};

/* --- HELPER 3: Anomalies --- */
const detectAnomalies = (data, avgDaily) => {
  if (!data.length || !avgDaily) return [];

  return data
    .map(d => ({
      date: d.date,
      total: d.total,
      deviationAmount: d.total - avgDaily,
      deviationPct: ((d.total - avgDaily) / avgDaily) * 100,
      isHigh: d.total > avgDaily
    }))
    .filter(d => Math.abs(d.deviationPct) > 20)
    .sort((a, b) => Math.abs(b.deviationPct) - Math.abs(a.deviationPct))
    .slice(0, 5);
};

/* --- HELPER 4: Risk Matrix --- */
const calculateRiskMatrix = (breakdown, timeSeries, nameMap) => {
  const history = {};

  timeSeries.forEach(r => {
    const id = String(r.groupId ?? 'null');
    history[id] = history[id] || [];
    history[id].push(parseFloat(r.cost));
  });

  return breakdown.map(item => {
    const id = String(item.id);
    const costs = history[id] || [];

    let growth = 0;
    if (costs.length > 1) {
      const mid = Math.floor(costs.length / 2);
      const first = costs.slice(0, mid).reduce((a, b) => a + b, 0);
      const second = costs.slice(mid).reduce((a, b) => a + b, 0);
      if (first > 0) growth = ((second - first) / first) * 100;
    }

    const totalCost = parseFloat(item.value);
    let severity = 'low';
    let status = 'Stable';

    if (growth > 20) severity = 'medium', status = 'Velocity Risk';
    if (totalCost > 1000 && growth > 15) severity = 'critical', status = 'Critical Expansion';
    if (id === 'null') severity = 'high', status = 'Blind Spot';

    return {
      id,
      name: nameMap[id] || 'Unallocated',
      x: Math.round(totalCost),
      y: Number(growth.toFixed(1)),
      z: Math.round(totalCost / 100),
      severity,
      status
    };
  });
};

/* ===================== MAIN ===================== */

export const generateCostAnalysis = async (filters = {}, groupBy) => {

  const uploadIds = normalizeUploadIds(filters);

  if (!uploadIds.length) {
    throw new Error('uploadIds is required for cost analysis');
  }

  const normalizedFilters = {
    ...filters,
    uploadIds
  };

  const [kpiResult, breakdownResult, timeSeriesResult] = await Promise.all([
    costAnalysisRepository.getTotalSpend(normalizedFilters),
    costAnalysisRepository.getBreakdown(normalizedFilters, groupBy),
    costAnalysisRepository.getTimeSeries(normalizedFilters, groupBy)
  ]);

  /* -------- chart shaping logic unchanged -------- */

  const topIds = new Set(breakdownResult.slice(0, CHART_MAX_SERIES).map(b => String(b.id)));
  const nameMap = await costAnalysisRepository.resolveNames(
    new Set([...breakdownResult.map(b => b.id), ...timeSeriesResult.map(t => t.groupId)]),
    groupBy
  );

  const chartMap = {};
  const activeKeys = new Set();
  let peakUsage = 0;
  let peakDate = null;

  timeSeriesResult.forEach(row => {
    const date = row.date?.toISOString().split('T')[0];
    if (!date) return;

    const cost = parseFloat(row.cost || 0);
    const key = topIds.has(String(row.groupId)) ? nameMap[row.groupId] : 'Other';

    chartMap[date] ??= { date, total: 0 };
    chartMap[date][key] = (chartMap[date][key] || 0) + cost;
    chartMap[date].total += cost;

    activeKeys.add(key);
    if (chartMap[date].total > peakUsage) {
      peakUsage = chartMap[date].total;
      peakDate = date;
    }
  });

  const finalChartData = fillDateGaps(Object.values(chartMap));
  const totalSpend = parseFloat(kpiResult || 0);
  const avgDaily = totalSpend / (finalChartData.length || 1);

  const forecastItems = calculateForecastWithRange(finalChartData);
  const forecastTotal = forecastItems.filter(f => f.type === 'future')
    .reduce((a, b) => a + b.forecast, 0);

  const riskData = calculateRiskMatrix(breakdownResult, timeSeriesResult, nameMap);
  const drivers = calculateCostDrivers(timeSeriesResult, nameMap);

  return {
    kpis: {
      totalSpend,
      avgDaily,
      peakUsage,
      peakDate,
      forecastTotal,
      atRiskSpend: riskData.filter(r => ['high', 'critical'].includes(r.severity))
        .reduce((a, b) => a + b.x, 0)
    },
    chartData: finalChartData,
    predictabilityChartData: [...finalChartData, ...forecastItems],
    anomalies: detectAnomalies(finalChartData, avgDaily),
    activeKeys: [...activeKeys],
    drivers,
    riskData,
    breakdown: breakdownResult.map(b => ({ name: nameMap[b.id], value: b.value }))
  };
};

/* ===================== FILTER OPTIONS ===================== */

export const getFilterDropdowns = async () => {
  return costAnalysisRepository.getFilterOptions();
};


/**
 * Fetch raw billing facts for a given period + filters + uploadIds.
 * Includes Resource (and dimensions optionally) so compliance screens can show resource names.
 *
 * @param {Object} params
 * @param {Object} params.filters - { provider, service, region }
 * @param {Date|string|null} params.startDate
 * @param {Date|string|null} params.endDate
 * @param {string[]} params.uploadIds
 * @returns {Promise<Array>} BillingUsageFact rows (Sequelize instances)
 */
export async function getCostDataWithResources(params = {}) {
  const {
    filters = {},
    startDate = null,
    endDate = null,
    uploadIds = []
  } = params;

  const {
    provider = 'All',
    service = 'All',
    region = 'All'
  } = filters;

  // ✅ Normalize uploadIds
  const safeUploadIds = Array.isArray(uploadIds)
    ? uploadIds.map(String).map(s => s.trim()).filter(Boolean)
    : [];

  // 🔒 Enforce upload isolation
  if (safeUploadIds.length === 0) {
    console.warn('getCostDataWithResources: no uploadIds provided');
    return [];
  }

  const where = {
    uploadid: { [Op.in]: safeUploadIds },
    billedcost: { [Op.gt]: 0 }
  };

  // Date range
  if (startDate || endDate) {
    where.chargeperiodstart = {};
    if (startDate) where.chargeperiodstart[Op.gte] = startDate;
    if (endDate) where.chargeperiodstart[Op.lte] = endDate;
  }

  const include = [];

  // CloudAccount (case-insensitive provider filter)
  include.push({
    model: CloudAccount,
    as: 'cloudAccount',
    required: provider !== 'All',
    ...(provider !== 'All'
      ? {
          where: Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('cloudAccount.providername')),
            provider.toLowerCase()
          )
        }
      : {}),
    attributes: [
      'id',
      'providername',
      'billingaccountid',
      'billingaccountname'
    ]
  });

  // Service
  include.push({
    model: Service,
    as: 'service',
    required: service !== 'All',
    ...(service !== 'All' ? { where: { servicename: service } } : {}),
    attributes: ['serviceid', 'servicename']
  });

  // Region
  include.push({
    model: Region,
    as: 'region',
    required: region !== 'All',
    ...(region !== 'All' ? { where: { regionname: region } } : {}),
    attributes: ['id', 'regionname']
  });

  // Resource
  include.push({
    model: Resource,
    as: 'resource',
    required: false,
    attributes: ['resourceid', 'resourcename', 'resourcetype']
  });

  const results = await BillingUsageFact.findAll({
    where,
    include,
    attributes: [
      'id',
      'uploadid',
      'cloudaccountid',
      'serviceid',
      'regionid',
      'resourceid',
      'billedcost',
      'chargeperiodstart',
      'tags',
      'chargedescription',
      'chargecategory',
      'chargeclass',
      'consumedquantity'
    ],
    order: [['chargeperiodstart', 'ASC']],
    raw: false // IMPORTANT
  });

  // ✅ Always return array
  return Array.isArray(results) ? results : [];
}


export async function getCostData(params = {}) {
  return getCostDataWithResources(params);
}

export const costsService = {
  getCostDataWithResources,
  getCostData
};

export default costsService;
