import { costDriversService as coreCostDriversService } from '../../../../core-dashboard/analytics/cost-drivers/cost-drivers.service.js';
import { costDriversRepository } from '../../../../core-dashboard/analytics/cost-drivers/cost-drivers.repository.js';

/**
 * Build SKU-level drivers from raw billing facts.
 * Output: [{ sku, curr, prev, diff, pct }]
 */
function buildSkuDrivers(cleanData = [], cutoffCurrent, cutoffPrev, minChange = 0) {
  const map = new Map();

  for (const row of cleanData) {
    if (!row?.date || row.date <= cutoffPrev) continue;

    const sku = row.Sku || row.SKU || row.SkuId || row.SKUId || row.SkuName || row.SKUName || row.SkuCode || row.skuid || 'Unknown SKU';
    const cost = Number(row.cost || 0);

    const key = String(sku);
    if (!map.has(key)) map.set(key, { sku: key, curr: 0, prev: 0 });

    if (row.date > cutoffCurrent) map.get(key).curr += cost;
    else if (row.date > cutoffPrev) map.get(key).prev += cost;
  }

  const rows = Array.from(map.values())
    .map(r => ({
      ...r,
      diff: r.curr - r.prev,
      pct: r.prev === 0 ? (r.curr > 0 ? Infinity : 0) : ((r.curr - r.prev) / r.prev) * 100
    }))
    .filter(r => Math.abs(r.diff) >= minChange)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 20);

  return rows;
}

/**
 * Commitment attribution:
 * Uses best-effort classification from charge fields.
 * Output:
 *  {
 *    byType: [{ type, curr, prev, diff }],
 *    totals: { currCommitmentSpend, prevCommitmentSpend, diff }
 *  }
 */
function buildCommitmentAttribution(cleanData = [], cutoffCurrent, cutoffPrev) {
  const classify = (row) => {
    const text = `${row.ChargeCategory || ''} ${row.ChargeClass || ''} ${row.ChargeDescription || ''} ${row.ItemDescription || ''}`.toLowerCase();

    // Example buckets (adjust to your dataset naming)
    if (text.includes('reserved') || text.includes('ri')) return 'Reserved Instance';
    if (text.includes('savings plan') || text.includes('savingsplan')) return 'Savings Plan';
    if (text.includes('commitment')) return 'Commitment';
    return 'On-Demand';
  };

  const map = new Map();

  for (const row of cleanData) {
    if (!row?.date || row.date <= cutoffPrev) continue;

    const type = classify(row);
    const cost = Number(row.cost || 0);

    if (!map.has(type)) map.set(type, { type, curr: 0, prev: 0 });

    if (row.date > cutoffCurrent) map.get(type).curr += cost;
    else if (row.date > cutoffPrev) map.get(type).prev += cost;
  }

  const byType = Array.from(map.values())
    .map(t => ({ ...t, diff: t.curr - t.prev }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const currCommitmentSpend = byType
    .filter(x => x.type !== 'On-Demand')
    .reduce((s, x) => s + x.curr, 0);

  const prevCommitmentSpend = byType
    .filter(x => x.type !== 'On-Demand')
    .reduce((s, x) => s + x.prev, 0);

  return {
    byType,
    totals: {
      currCommitmentSpend,
      prevCommitmentSpend,
      diff: currCommitmentSpend - prevCommitmentSpend
    }
  };
}

export const clientDCostDriversService = {
  /**
   * Extended drivers summary (core + skuDrivers + commitment attribution)
   */
  async getCostDrivers(options = {}) {
    const {
      filters = {},
      period = 30,
      dimension = 'ServiceName',
      minChange = 0,
      activeServiceFilter = 'All',
      uploadIds = []
    } = options;

    // 1) Core output (increases/decreases/overallStats/dynamics/periods)
    const core = await coreCostDriversService.getCostDrivers({
      filters,
      period,
      dimension,
      minChange,
      activeServiceFilter,
      uploadIds
    });

    // If no data, return core + empty extensions
    if (!core || (!core.increases?.length && !core.decreases?.length)) {
      return {
        ...(core || {}),
        skuDrivers: [],
        commitmentAttribution: { byType: [], totals: {} }
      };
    }

    // 2) We need raw facts for SKU + commitment buckets
    const rawData = await costDriversRepository.getBillingFactsForDrivers({
      filters,
      period,
      uploadIds
    });

    const cleanData = (rawData || [])
      .map(d => {
        let date = null;
        if (d.ChargePeriodStart) {
          date = new Date(d.ChargePeriodStart);
          if (isNaN(date.getTime())) date = null;
        }
        return { ...d, cost: parseFloat(d.BilledCost) || 0, date };
      })
      .filter(d => d.date && !isNaN(d.date.getTime()));

    // derive cutoff dates same as core
    const maxDate = new Date(Math.max(...cleanData.map(d => d.date.getTime())));
    const cutoffCurrent = new Date(maxDate);
    cutoffCurrent.setDate(cutoffCurrent.getDate() - period);

    const cutoffPrev = new Date(cutoffCurrent);
    cutoffPrev.setDate(cutoffPrev.getDate() - period);

    // 3) Extensions
    const skuDrivers = buildSkuDrivers(cleanData, cutoffCurrent, cutoffPrev, minChange);
    const commitmentAttribution = buildCommitmentAttribution(cleanData, cutoffCurrent, cutoffPrev);

    return {
      ...core,
      skuDrivers,
      commitmentAttribution
    };
  },

  /**
   * Extended drilldown:
   * core details + SKU breakdown + commitment breakdown for the selected driver rows
   */
  async getDriverDetails(options = {}) {
    const { driver, period = 30 } = options;

    // Core drilldown (trendData/subDrivers/topResources/annualizedImpact/insightText)
    const coreDetails = await coreCostDriversService.getDriverDetails(options);

    const rows = Array.isArray(driver?.rows) ? driver.rows : [];

    // SKU breakdown within THIS driver only (curr period)
    const skuMap = {};
    rows
      .filter(r => r.period === 'curr')
      .forEach(r => {
        const sku = r.Sku || r.SKU || r.SkuId || r.SKUId || r.SkuName || r.SKUName || r.SkuCode || r.skuid || 'Unknown SKU';
        skuMap[sku] = (skuMap[sku] || 0) + (Number(r.cost || 0));
      });

    const skuBreakdown = Object.entries(skuMap)
      .map(([sku, value]) => ({ sku, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Commitment breakdown within THIS driver only (curr period)
    const classify = (r) => {
      const text = `${r.ChargeCategory || ''} ${r.ChargeClass || ''} ${r.ChargeDescription || ''} ${r.ItemDescription || ''}`.toLowerCase();
      if (text.includes('reserved') || text.includes('ri')) return 'Reserved Instance';
      if (text.includes('savings plan') || text.includes('savingsplan')) return 'Savings Plan';
      if (text.includes('commitment')) return 'Commitment';
      return 'On-Demand';
    };

    const commitmentMap = {};
    rows
      .filter(r => r.period === 'curr')
      .forEach(r => {
        const type = classify(r);
        commitmentMap[type] = (commitmentMap[type] || 0) + (Number(r.cost || 0));
      });

    const commitmentBreakdown = Object.entries(commitmentMap)
      .map(([type, value]) => ({ type, value }))
      .sort((a, b) => b.value - a.value);

    return {
      ...coreDetails,
      skuBreakdown,
      commitmentBreakdown,
      periodDays: period
    };
  }
};
