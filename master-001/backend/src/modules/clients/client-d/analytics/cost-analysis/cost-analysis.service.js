import { generateCostAnalysis } from '../../../../core-dashboard/analytics/cost-analysis/cost-analysis.service.js';

/**
 * Monthly aggregation from daily chartData
 * chartData rows look like: { date: "YYYY-MM-DD", total: number, ...series }
 */
function toMonthlyTrends(dailyChartData = []) {
  const bucket = new Map();

  for (const row of dailyChartData) {
    const date = row?.date;
    if (!date) continue;

    const monthKey = date.slice(0, 7); // "YYYY-MM"
    const total = Number(row?.total || 0);

    bucket.set(monthKey, (bucket.get(monthKey) || 0) + total);
  }

  return Array.from(bucket.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({ month, total }));
}

export const clientDCostAnalysisService = {
  /**
   * Reduced Cost Analysis for Client-D
   * Keeps:
   *  ✅ Daily trends (chartData)
   *  ✅ Monthly trends (derived)
   *  ✅ GroupBy breakdown
   * Removes:
   *  ❌ Predictability chart / score
   *  ❌ Risk / volatility / at-risk spend
   */
  async getCostAnalysis(params, groupBy) {
    // Call core engine
    const core = await generateCostAnalysis(params, groupBy);

    const totalSpend = Number(core?.kpis?.totalSpend || 0);
    const avgDaily = Number(core?.kpis?.avgDaily || 0);

    const dailyTrends = Array.isArray(core?.chartData) ? core.chartData : [];
    const monthlyTrends = toMonthlyTrends(dailyTrends);

    // breakdown already groupBy-based (service or region)
    const breakdown = Array.isArray(core?.breakdown) ? core.breakdown : [];

    // Reduced response
    return {
      kpis: {
        totalSpend,
        avgDaily
      },
      dailyTrends,
      monthlyTrends,
      breakdown,
      groupBy
    };
  }
};
