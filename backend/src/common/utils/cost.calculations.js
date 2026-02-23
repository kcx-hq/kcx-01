/**
 * Centralized cost calculation formulas.
 * Use these wherever cost metrics are computed so values stay consistent across dashboard, reports, and analytics.
 *
 * Definitions:
 *   Total_Spend = SUM(BilledCost)
 *   Effective_Spend = SUM(EffectiveCost)
 *   List_Spend = SUM(ListCost)
 *   Contracted_Spend = SUM(ContractedCost)
 */

const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Round numeric value to fixed decimal places.
 */
export function roundTo(value, decimals = 2) {
  return Number(toNum(value, 0).toFixed(decimals));
}

/**
 * Savings = List_Spend - Effective_Spend
 */
export function savings(listSpend, effectiveSpend) {
  return toNum(listSpend, 0) - toNum(effectiveSpend, 0);
}

/**
 * Savings_Percentage = (Savings / List_Spend) × 100
 */
export function savingsPercentage(listSpend, effectiveSpend) {
  const list = toNum(listSpend, 0);
  if (!list || list <= 0) return 0;
  const sav = savings(listSpend, effectiveSpend);
  return (sav / list) * 100;
}

/**
 * Daily_Average_Spend = SUM(BilledCost) / Days_Elapsed
 */
export function dailyAverageSpend(totalSpend, daysElapsed) {
  if (!daysElapsed || daysElapsed <= 0) return 0;
  return toNum(totalSpend, 0) / daysElapsed;
}

/**
 * Forecasted_Monthly_Spend = Daily_Average_Spend × Total_Days_In_Month
 */
export function forecastedMonthlySpend(dailyAverageSpendVal, totalDaysInMonth) {
  return toNum(dailyAverageSpendVal, 0) * Math.max(0, toNum(totalDaysInMonth, 30));
}

/**
 * Month_Over_Month_Change = Current_Month_Spend - Previous_Month_Spend
 */
export function monthOverMonthChange(currentMonthSpend, previousMonthSpend) {
  return toNum(currentMonthSpend, 0) - toNum(previousMonthSpend, 0);
}

/**
 * Month_Over_Month_Percentage = ((Current_Month_Spend - Previous_Month_Spend) / Previous_Month_Spend) × 100
 */
export function monthOverMonthPercentage(currentMonthSpend, previousMonthSpend) {
  const prev = toNum(previousMonthSpend, 0);
  if (!prev || prev <= 0) return 0;
  return (monthOverMonthChange(currentMonthSpend, previousMonthSpend) / prev) * 100;
}

/**
 * Period_Over_Period_Percentage = ((Current_Period_Spend - Previous_Period_Spend) / Previous_Period_Spend) * 100
 */
export function periodOverPeriodPercentage(currentPeriodSpend, previousPeriodSpend) {
  return monthOverMonthPercentage(currentPeriodSpend, previousPeriodSpend);
}

/**
 * Cost_Share_Percentage = (Entity_Cost / Total_Spend) × 100
 */
export function costSharePercentage(entityCost, totalSpend) {
  const total = toNum(totalSpend, 0);
  if (!total || total <= 0) return 0;
  return (toNum(entityCost, 0) / total) * 100;
}

/**
 * Cost_Change = Current_Period_Cost - Previous_Period_Cost
 */
export function costChange(currentPeriodCost, previousPeriodCost) {
  return toNum(currentPeriodCost, 0) - toNum(previousPeriodCost, 0);
}

/**
 * Cost_Growth_Rate = (Cost_Change / Previous_Period_Cost) × 100
 */
export function costGrowthRate(currentPeriodCost, previousPeriodCost) {
  const prev = toNum(previousPeriodCost, 0);
  if (!prev || prev <= 0) return 0;
  return (costChange(currentPeriodCost, previousPeriodCost) / prev) * 100;
}

/**
 * Cost_Per_Unit = BilledCost / ConsumedQuantity
 */
export function costPerUnit(billedCost, consumedQuantity) {
  const qty = toNum(consumedQuantity, 0);
  if (!qty || qty <= 0) return 0;
  return toNum(billedCost, 0) / qty;
}

/**
 * Spike_Flag: Current_Day_Cost > (Average_Last_7_Days × 1.5)
 */
export function isSpikeFlag(currentDayCost, averageLast7Days, multiplier = 1.5) {
  const avg = toNum(averageLast7Days, 0);
  const current = toNum(currentDayCost, 0);
  return avg > 0 && current > avg * multiplier;
}

/**
 * Tagged_Resources_Percentage = (Tagged_Resources / Total_Resources) × 100
 */
export function taggedResourcesPercentage(taggedResources, totalResources) {
  const total = toNum(totalResources, 0);
  if (!total || total <= 0) return 0;
  return (toNum(taggedResources, 0) / total) * 100;
}

/**
 * Untagged_Cost: SUM(BilledCost) WHERE Tags IS NULL OR Tags = '{}'
 * (Caller does the filter; this just returns share if needed.)
 * Untagged_Cost_Share_Percentage = (Untagged_Cost / Total_Spend) × 100
 */
export function untaggedCostSharePercentage(untaggedCost, totalSpend) {
  return costSharePercentage(untaggedCost, totalSpend);
}

/**
 * Burn_Rate = Total_Project_Spend / Days_Elapsed
 */
export function burnRate(totalProjectSpend, daysElapsed) {
  if (!daysElapsed || daysElapsed <= 0) return 0;
  return toNum(totalProjectSpend, 0) / daysElapsed;
}

/**
 * Budget_Variance = Actual_Spend - Budget
 */
export function budgetVariance(actualSpend, budget) {
  return toNum(actualSpend, 0) - toNum(budget, 0);
}

/**
 * Budget_Utilization_Percentage = (Actual_Spend / Budget) × 100
 */
export function budgetUtilizationPercentage(actualSpend, budget) {
  const b = toNum(budget, 0);
  if (!b || b <= 0) return 0;
  return (toNum(actualSpend, 0) / b) * 100;
}

/**
 * Projected_Budget_Overrun = Forecasted_Spend - Budget
 */
export function projectedBudgetOverrun(forecastedSpend, budget) {
  return toNum(forecastedSpend, 0) - toNum(budget, 0);
}

/**
 * Discount_Percentage = ((ListUnitPrice - ContractedUnitPrice) / ListUnitPrice) × 100
 */
export function discountPercentage(listUnitPrice, contractedUnitPrice) {
  const list = toNum(listUnitPrice, 0);
  if (!list || list <= 0) return 0;
  return ((list - toNum(contractedUnitPrice, 0)) / list) * 100;
}

/**
 * Unused_Commitment_Waste = PricingQuantity - ConsumedQuantity (per row; caller aggregates if needed)
 */
export function unusedCommitmentWaste(pricingQuantity, consumedQuantity) {
  return Math.max(0, toNum(pricingQuantity, 0) - toNum(consumedQuantity, 0));
}

/**
 * Potential_Savings = SUM(ListCost) - SUM(EffectiveCost)  => same as savings(listSpend, effectiveSpend)
 */
export function potentialSavings(listSpend, effectiveSpend) {
  return savings(listSpend, effectiveSpend);
}

/**
 * Optimization_Coverage = (Optimized_Resources / Total_Resources) × 100
 */
export function optimizationCoverage(optimizedResources, totalResources) {
  return taggedResourcesPercentage(optimizedResources, totalResources);
}

/**
 * Waste_Percentage = (Wasted_Cost / Total_Spend) × 100
 */
export function wastePercentage(wastedCost, totalSpend) {
  return costSharePercentage(wastedCost, totalSpend);
}

/**
 * Cost_Efficiency_Score = EffectiveCost / ConsumedQuantity (per row; caller may average)
 */
export function costEfficiencyScore(effectiveCost, consumedQuantity) {
  const qty = toNum(consumedQuantity, 0);
  if (!qty || qty <= 0) return 0;
  return toNum(effectiveCost, 0) / qty;
}

/**
 * Shared_Cost_Allocation = (Team_Usage / Total_Usage) × Shared_Cost
 */
export function sharedCostAllocation(teamUsage, totalUsage, sharedCost) {
  const total = toNum(totalUsage, 0);
  if (!total || total <= 0) return 0;
  return (toNum(teamUsage, 0) / total) * toNum(sharedCost, 0);
}

/**
 * High_Cost_Low_Usage_Flag: Cost_Per_Unit > 75th_Percentile (caller provides 75th percentile value)
 */
export function isHighCostLowUsageFlag(costPerUnit, percentile75) {
  return toNum(costPerUnit, 0) > toNum(percentile75, 0);
}

/**
 * Anomaly_Threshold = Mean + (Sigma * StdDev)
 */
export function anomalyThreshold(mean, stdDev, sigma = 2) {
  return toNum(mean, 0) + toNum(sigma, 2) * toNum(stdDev, 0);
}

/**
 * Inclusive_Day_Count = (End_Date - Start_Date) + 1
 */
export function inclusiveDayCount(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  if (endUtc < startUtc) return 0;

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((endUtc - startUtc) / msPerDay) + 1;
}

/**
 * Average_Daily_Spend_From_Period = Total_Spend / Inclusive_Day_Count
 * Falls back to fallbackDays when period dates are not available.
 */
export function averageDailyFromPeriod(totalSpend, startDate, endDate, fallbackDays = 1) {
  const days = inclusiveDayCount(startDate, endDate) || Math.max(1, toNum(fallbackDays, 1));
  return dailyAverageSpend(totalSpend, days);
}

/**
 * Split_Period_Trend_Percentage:
 *  1) Split daily totals into previous half and current half.
 *  2) Trend% = ((CurrentHalf - PreviousHalf) / PreviousHalf) * 100
 */
export function splitPeriodTrendPercentage(dailyTotals = []) {
  if (!Array.isArray(dailyTotals) || dailyTotals.length === 0) return 0;

  const values = dailyTotals.map((v) => toNum(v, 0));
  const mid = Math.floor(values.length / 2);
  const previous = mid > 0 ? values.slice(0, mid).reduce((a, b) => a + b, 0) : 0;
  const current = values.slice(mid).reduce((a, b) => a + b, 0);

  if (!previous || previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Missing_Mandatory_Tag: environment IS NULL OR owner IS NULL OR application IS NULL (caller checks tags object)
 */
export function hasMissingMandatoryTag(tags, keys = ['environment', 'owner', 'application']) {
  if (!tags || typeof tags !== 'object') return true;
  const lower = (k) => (tags[k] ?? tags[k.toLowerCase?.()] ?? tags[k.toUpperCase?.()]);
  return keys.some((k) => {
    const v = lower(k);
    return v == null || String(v).trim() === '';
  });
}
