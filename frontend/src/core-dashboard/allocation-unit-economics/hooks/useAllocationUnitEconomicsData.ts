import { useEffect, useMemo, useState } from 'react';
import type {
  AllocationUnitEconomicsControls,
  AllocationUnitEconomicsViewModel,
  CoverageState,
  ExportRow,
  HeatmapCell,
  ShowbackRow,
  UnitDecompositionComponent,
  UnitTrendPoint,
  VarianceRow,
} from '../types';

const DEFAULT_VIEW_MODEL: AllocationUnitEconomicsViewModel = {
  kpis: {
    totalCost: 0,
    previousTotalCost: 0,
    directCost: 0,
    sharedAllocatedCost: 0,
    commitmentBenefit: 0,
    totalQuantity: 0,
    previousTotalQuantity: 0,
    avgUnitPrice: 0,
    previousAvgUnitPrice: 0,
    unitPriceChangePct: 0,
    unitPriceDelta: 0,
    status: 'insufficient_data',
    comparisonLabel: 'Comparison window unavailable',
    elasticityScore: null,
    elasticityClass: 'undefined',
    elasticityConfidence: 'low',
    volatilityPct: 0,
    volatilityState: 'low',
    trend: [],
    efficiencyStatus: 'insufficient_data',
    efficiencyInsight: 'Insufficient data for efficiency signal.',
    costGrowthPct: 0,
    volumeGrowthPct: 0,
    decomposition: {
      startUnitCost: 0,
      endUnitCost: 0,
      components: [],
      validationDelta: 0,
    },
    forecast: {
      projectedCost: 0,
      projectedVolume: 0,
      projectedUnitCost: 0,
      lowerUnitCost: 0,
      upperUnitCost: 0,
      confidence: 'low',
      method: 'moving_average',
      assumptions: [],
    },
    target: {
      targetUnitCost: null,
      source: 'none',
      gapValue: null,
      gapPct: null,
      improvementNeededPct: null,
      impliedVolumeAtCurrentCost: null,
    },
    insightPanel: {
      classification: 'insufficient_data',
      rootCause: 'Data coverage is insufficient for root-cause classification.',
      riskFlags: [],
      summary: 'Need additional periods to generate deterministic efficiency insights.',
    },
  },
  allocationOverview: {
    totalCloudCost: 0,
    allocatedPct: 0,
    unallocatedPct: 0,
    sharedCostPoolAmount: 0,
    allocationMethod: 'direct_spend_weighted',
    allocationConfidence: {
      score: 0,
      level: 'low',
      factors: {
        tagCoveragePct: 0,
        sharedPoolRatioPct: 0,
        ruleCompletenessPct: 0,
        dataConsistencyPct: 0,
      },
    },
  },
  coverage: {
    team: { label: 'Allocated to Team', valuePct: null, state: 'na' },
    product: { label: 'Allocated to Product', valuePct: null, state: 'na' },
    owner: { label: 'Allocated to Owner', valuePct: null, state: 'na' },
    unallocatedAmount: 0,
    unallocatedPct: null,
  },
  sharedPool: {
    total: 0,
    ruleApplied: 'No shared pool detected',
    redistributedAmount: 0,
    rows: [],
  },
  sharedPoolTransparency: [],
  unallocatedInsight: {
    unallocatedAmount: 0,
    unallocatedPct: 0,
    topContributingServices: [],
    tagCoveragePct: 0,
    governanceMaturity: 'weak',
  },
  showbackRows: [],
  teamProductUnitRows: [],
  environmentUnitRows: [],
  margin: {
    available: false,
    revenuePerUnit: null,
    costPerUnit: null,
    marginPerUnit: null,
    marginTrendPct: null,
  },
  teamVariance: [],
  productVariance: [],
  heatmap: [],
  exportRows: [],
  periodLabel: 'N/A',
  notes: [
    'Product and environment allocation dimensions are currently limited by available backend tags.',
  ],
};

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const growthPct = (curr: number, prev: number): number => {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const clampPct = (value: number | null): number | null => {
  if (value === null || !Number.isFinite(value)) return null;
  return clamp(value, 0, 100);
};

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const stdDev = (values: number[]): number => {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length - 1);
  return Math.sqrt(variance);
};

const getCoverageState = (pct: number | null): CoverageState => {
  if (pct === null || !Number.isFinite(pct)) return 'na';
  if (pct >= 95) return 'green';
  if (pct >= 80) return 'amber';
  return 'red';
};

const parsePayload = (value: unknown) => {
  if (!value || typeof value !== 'object') return {};
  const root = value as { success?: boolean; data?: unknown };
  if (root.success && root.data && typeof root.data === 'object') return root.data as Record<string, unknown>;
  if (root.data && typeof root.data === 'object') return root.data as Record<string, unknown>;
  return value as Record<string, unknown>;
};

const mapPeriod = (period: AllocationUnitEconomicsControls['period']): string => {
  if (period === '90d') return 'last90days';
  if (period === 'month') return 'month';
  return 'last30days';
};

const mapPeriodLabel = (period: AllocationUnitEconomicsControls['period']): string => {
  if (period === '90d') return 'Last 90 Days';
  if (period === 'month') return 'Month to Date';
  return 'Last 30 Days';
};

const mapCompareLabel = (compareTo: AllocationUnitEconomicsControls['compareTo']): string => {
  if (compareTo === 'same_period_last_month') return 'Same Period Last Month';
  return 'Previous Period';
};

const formatRangeDate = (value: unknown): string | null => {
  const text = String(value || '').trim();
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const buildShowbackRows = (accounts: Array<Record<string, unknown>>, totalCost: number): ShowbackRow[] => {
  if (!accounts.length) return [];

  const grouped = new Map<string, { direct: number }>();
  accounts.forEach((account) => {
    const owner = String(account.owner || '').trim() || 'Unassigned';
    const cost = toNumber(account.cost);
    const entry = grouped.get(owner) || { direct: 0 };
    entry.direct += cost;
    grouped.set(owner, entry);
  });

  const baseRows = Array.from(grouped.entries()).map(([team, value]) => ({
    team,
    directCost: value.direct,
  }));

  const directTotal = baseRows.reduce((sum, row) => sum + row.directCost, 0);
  const residualSharedPool = Math.max(0, totalCost - directTotal);

  return baseRows
    .map((row) => {
      const weight = directTotal > 0 ? row.directCost / directTotal : 0;
      const sharedAllocatedCost = residualSharedPool * weight;
      const total = row.directCost + sharedAllocatedCost;
      return {
        team: row.team,
        product: 'All Products',
        environment: 'All',
        directCost: Number(row.directCost.toFixed(2)),
        sharedAllocatedCost: Number(sharedAllocatedCost.toFixed(2)),
        totalCost: Number(total.toFixed(2)),
        pctOfTotal: totalCost > 0 ? Number(((total / totalCost) * 100).toFixed(2)) : 0,
        budget: null,
        budgetVariance: null,
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost);
};

const mapAllocationRows = (rows: unknown): ShowbackRow[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        team: String(row.team || 'Unassigned Team'),
        product: String(row.product || 'Unmapped Product'),
        environment: String(row.environment || 'Unspecified'),
        directCost: toNumber(row.directCost),
        sharedAllocatedCost: toNumber(row.sharedAllocatedCost),
        totalCost: toNumber(row.totalCost),
        pctOfTotal: toNumber(row.pctOfTotal),
        budget: null,
        budgetVariance: null,
      };
    })
    .filter((row) => row.totalCost > 0 || row.directCost > 0 || row.sharedAllocatedCost > 0)
    .sort((a, b) => b.totalCost - a.totalCost);
};

const deriveProductCoveragePct = (rows: ShowbackRow[], totalSpend: number): number | null => {
  if (totalSpend <= 0) return null;
  const mapped = rows
    .filter((row) => {
      const product = String(row.product || '').trim().toLowerCase();
      return product && product !== 'unmapped product' && product !== 'all products';
    })
    .reduce((sum, row) => sum + row.totalCost, 0);
  return (mapped / totalSpend) * 100;
};

const buildHeatmap = (showbackRows: ShowbackRow[], totalCost: number): HeatmapCell[] => {
  return showbackRows.slice(0, 8).map((row) => {
    const pct = totalCost > 0 ? (row.totalCost / totalCost) * 100 : 0;
    const intensityBand: HeatmapCell['intensityBand'] =
      pct > 30 ? 5 : pct > 20 ? 4 : pct > 10 ? 3 : pct > 5 ? 2 : 1;
    const riskFlags: string[] = [];
    if (row.team === 'Unassigned' && pct > 8) riskFlags.push('no_owner');
    if (pct > 35) riskFlags.push('concentration');
    return {
      team: row.team,
      environment: row.environment,
      spend: row.totalCost,
      pctOfTotal: Number(pct.toFixed(2)),
      intensityBand,
      riskFlags,
    };
  });
};

const buildExportRows = (
  showbackRows: ShowbackRow[],
  periodLabel: string,
  basis: AllocationUnitEconomicsControls['basis'],
  allocationRule: string,
): ExportRow[] =>
  showbackRows.map((row) => ({
    team: row.team,
    product: row.product,
    environment: row.environment,
    directCost: row.directCost,
    sharedCost: row.sharedAllocatedCost,
    totalCost: row.totalCost,
    period: periodLabel,
    costBasis: basis,
    allocationRuleUsed: allocationRule,
  }));

const mapTrend = (currentRaw: unknown, previousRaw: unknown): UnitTrendPoint[] => {
  const current = Array.isArray(currentRaw)
    ? currentRaw.map((point) => ({
        date: String((point as Record<string, unknown>).date || ''),
        cost: toNumber((point as Record<string, unknown>).cost),
        quantity: toNumber((point as Record<string, unknown>).quantity),
        unitPrice: toNumber((point as Record<string, unknown>).unitPrice),
      }))
    : [];

  const previous = Array.isArray(previousRaw)
    ? previousRaw.map((point) => ({
        date: String((point as Record<string, unknown>).date || ''),
        cost: toNumber((point as Record<string, unknown>).cost),
        quantity: toNumber((point as Record<string, unknown>).quantity),
        unitPrice: toNumber((point as Record<string, unknown>).unitPrice),
      }))
    : [];

  if (!current.length) return [];

  const offset = previous.length - current.length;
  const base = current.map((point, index) => {
    const prevPoint = previous[index + offset] || null;
    const prevDay = index > 0 ? current[index - 1] : null;
    const dayCostGrowth = prevDay ? growthPct(point.cost, prevDay.cost) : 0;
    const dayVolumeGrowth = prevDay ? growthPct(point.quantity, prevDay.quantity) : 0;
    const elasticity = prevDay && Math.abs(dayVolumeGrowth) >= 0.01 ? dayCostGrowth / dayVolumeGrowth : null;

    return {
      date: point.date,
      cost: point.cost,
      quantity: point.quantity,
      unitPrice: point.unitPrice,
      previousCost: prevPoint ? prevPoint.cost : 0,
      previousQuantity: prevPoint ? prevPoint.quantity : 0,
      previousUnitPrice: prevPoint ? prevPoint.unitPrice : 0,
      elasticity: elasticity !== null && Number.isFinite(elasticity) ? round(elasticity, 4) : null,
      isChangePoint: false,
      isOptimizationEvent: false,
    };
  });

  const deltas = base
    .map((point, index) => (index === 0 ? 0 : point.unitPrice - base[index - 1].unitPrice))
    .slice(1);
  const absDeltas = deltas.map((value) => Math.abs(value));
  const meanAbsDelta =
    absDeltas.length > 0 ? absDeltas.reduce((sum, value) => sum + value, 0) / absDeltas.length : 0;
  const deltaStd = stdDev(absDeltas);
  const threshold = meanAbsDelta + deltaStd * 1.5;

  return base.map((point, index) => {
    if (index === 0) return point;
    const delta = point.unitPrice - base[index - 1].unitPrice;
    const absDelta = Math.abs(delta);
    const isChangePoint = threshold > 0 && absDelta >= threshold;
    const isOptimizationEvent = isChangePoint && delta < 0;
    return { ...point, isChangePoint, isOptimizationEvent };
  });
};

const getStepValue = (steps: unknown, id: string): number => {
  if (!Array.isArray(steps)) return 0;
  const target = steps.find(
    (entry) =>
      String((entry as Record<string, unknown>).id || '').trim().toLowerCase() === id.toLowerCase(),
  ) as Record<string, unknown> | undefined;
  return target ? toNumber(target.value) : 0;
};

const deriveDecomposition = ({
  drivers,
  currentQuantity,
  currentUnitCost,
  previousUnitCost,
  currentSharedCost,
  previousSharedCost,
}: {
  drivers: Record<string, unknown>;
  currentQuantity: number;
  currentUnitCost: number;
  previousUnitCost: number;
  currentSharedCost: number;
  previousSharedCost: number;
}) => {
  const waterfall = (drivers.waterfall as Record<string, unknown> | undefined) || {};
  const steps = waterfall.steps;
  const usageGrowthCost = getStepValue(steps, 'usageGrowth');
  const infraGrowthCost = getStepValue(steps, 'newServicesResources');
  const priceChangeCost = getStepValue(steps, 'ratePriceChange');
  const mixShiftCost = getStepValue(steps, 'mixShift');
  const commitmentBenefitCost = getStepValue(steps, 'creditsDiscountChange');
  const optimizationSavingsCost = getStepValue(steps, 'savingsRemovals');
  const sharedDeltaCost = currentSharedCost - previousSharedCost;
  const adjustedMixShiftCost = mixShiftCost - sharedDeltaCost;

  const denominator = currentQuantity > 0 ? currentQuantity : 1;
  const totalUnitDelta = currentUnitCost - previousUnitCost;

  const components: UnitDecompositionComponent[] = [
    { id: 'traffic_growth_effect', label: 'Traffic Growth Effect', value: usageGrowthCost / denominator, contributionPct: 0 },
    { id: 'infra_growth_effect', label: 'Infra Growth Effect', value: infraGrowthCost / denominator, contributionPct: 0 },
    { id: 'price_change', label: 'Price Change', value: priceChangeCost / denominator, contributionPct: 0 },
    { id: 'optimization_savings', label: 'Optimization Savings', value: optimizationSavingsCost / denominator, contributionPct: 0 },
    { id: 'mix_shift', label: 'Mix Shift', value: adjustedMixShiftCost / denominator, contributionPct: 0 },
    { id: 'commitment_benefit', label: 'Commitment Benefit', value: commitmentBenefitCost / denominator, contributionPct: 0 },
    { id: 'shared_allocation_impact', label: 'Shared Allocation Impact', value: sharedDeltaCost / denominator, contributionPct: 0 },
  ];

  const correction = totalUnitDelta - components.reduce((sum, item) => sum + item.value, 0);
  const corrected = components.map((item) =>
    item.id === 'mix_shift' ? { ...item, value: item.value + correction } : item,
  );

  const finalized = corrected.map((item) => ({
    ...item,
    value: round(item.value, 6),
    contributionPct: Math.abs(totalUnitDelta) > 0 ? round((item.value / totalUnitDelta) * 100, 2) : 0,
  }));

  return {
    startUnitCost: round(previousUnitCost, 6),
    endUnitCost: round(currentUnitCost, 6),
    components: finalized,
    validationDelta: round(
      totalUnitDelta - finalized.reduce((sum, item) => sum + item.value, 0),
      6,
    ),
  };
};

const deriveForecast = (trend: UnitTrendPoint[]) => {
  if (!trend.length) {
    return {
      projectedCost: 0,
      projectedVolume: 0,
      projectedUnitCost: 0,
      lowerUnitCost: 0,
      upperUnitCost: 0,
      confidence: 'low' as const,
      method: 'moving_average',
      assumptions: ['No trend points available for projection.'],
    };
  }

  const sample = trend.slice(-Math.min(7, trend.length));
  const avgDailyCost = sample.reduce((sum, row) => sum + row.cost, 0) / sample.length;
  const avgDailyVolume = sample.reduce((sum, row) => sum + row.quantity, 0) / sample.length;
  const horizonDays = Math.max(7, Math.min(30, trend.length));
  const projectedCost = avgDailyCost * horizonDays;
  const projectedVolume = avgDailyVolume * horizonDays;
  const projectedUnitCost = projectedVolume > 0 ? projectedCost / projectedVolume : 0;

  const unitSeries = sample.map((row) => row.unitPrice).filter((value) => value > 0);
  const meanUnit = unitSeries.length > 0 ? unitSeries.reduce((sum, value) => sum + value, 0) / unitSeries.length : 0;
  const variation = meanUnit > 0 ? stdDev(unitSeries) / meanUnit : 0;
  const bandPct = clamp(variation, 0.08, 0.35);

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (variation <= 0.12) confidence = 'high';
  else if (variation <= 0.25) confidence = 'medium';

  return {
    projectedCost: round(projectedCost, 2),
    projectedVolume: round(projectedVolume, 2),
    projectedUnitCost: round(projectedUnitCost, 6),
    lowerUnitCost: round(projectedUnitCost * (1 - bandPct), 6),
    upperUnitCost: round(projectedUnitCost * (1 + bandPct), 6),
    confidence,
    method: 'moving_average',
    assumptions: [
      `Projection horizon: ${horizonDays} days`,
      'Assumes recent daily average is a valid short-horizon baseline',
      'Confidence band derives from recent unit-cost coefficient of variation',
    ],
  };
};

const deriveTarget = (currentUnitCost: number, previousUnitCost: number, currentCost: number) => {
  if (currentUnitCost <= 0) {
    return {
      targetUnitCost: null,
      source: 'none' as const,
      gapValue: null,
      gapPct: null,
      improvementNeededPct: null,
      impliedVolumeAtCurrentCost: null,
    };
  }

  const targetUnitCost = round(
    previousUnitCost > 0 ? Math.min(previousUnitCost, currentUnitCost * 0.95) : currentUnitCost * 0.95,
    6,
  );
  const gapValue = round(currentUnitCost - targetUnitCost, 6);
  const gapPct = currentUnitCost > 0 ? round((gapValue / currentUnitCost) * 100, 2) : null;
  return {
    targetUnitCost,
    source: 'derived' as const,
    gapValue,
    gapPct,
    improvementNeededPct: gapValue > 0 ? gapPct : 0,
    impliedVolumeAtCurrentCost: targetUnitCost > 0 ? round(currentCost / targetUnitCost, 2) : null,
  };
};

interface UseAllocationUnitEconomicsDataInput {
  api: { call: (module: string, endpoint: string, options?: Record<string, unknown>) => Promise<unknown> } | null;
  caps: Record<string, unknown> | null;
  filters: { provider?: string; service?: string; region?: string };
  controls: AllocationUnitEconomicsControls;
}

export function useAllocationUnitEconomicsData({
  api,
  caps,
  filters,
  controls,
}: UseAllocationUnitEconomicsDataInput) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<AllocationUnitEconomicsViewModel>(DEFAULT_VIEW_MODEL);

  const requestParams = useMemo(
    () => ({
      provider: filters.provider && filters.provider !== 'All' ? filters.provider : undefined,
      service: filters.service && filters.service !== 'All' ? filters.service : undefined,
      region: filters.region && filters.region !== 'All' ? filters.region : undefined,
    }),
    [filters.provider, filters.service, filters.region],
  );

  useEffect(() => {
    if (!api || !caps) return;

    const modules = (caps as { modules?: Record<string, { enabled?: boolean }> }).modules || {};
    const canUnit = Boolean(modules.unitEconomics?.enabled);
    const canGovernance = Boolean(modules.governance?.enabled);
    const canDrivers = Boolean(modules.costDrivers?.enabled);

    let mounted = true;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const unitPromise = canUnit
          ? api.call('unitEconomics', 'summary', {
              params: {
                ...requestParams,
                period: mapPeriod(controls.period),
                compareTo: controls.compareTo,
                costBasis: controls.basis,
              },
            })
          : Promise.resolve({});

        const governancePromise = canGovernance
          ? api.call('governance', 'accounts', {
              params: {
                ...requestParams,
                period: mapPeriod(controls.period),
                sortBy: 'cost',
                sortOrder: 'desc',
              },
            })
          : Promise.resolve({});

        const driversPromise = canDrivers
          ? api.call('costDrivers', 'costDrivers', {
              params: {
                ...requestParams,
                period: controls.period === '90d' ? 90 : 30,
                dimension: 'team',
                compareTo: controls.compareTo,
                costBasis: controls.basis,
                rowLimit: 20,
              },
            })
          : Promise.resolve({});

        const [unitRaw, governanceRaw, driversRaw] = await Promise.all([
          unitPromise,
          governancePromise,
          driversPromise,
        ]);

        if (!mounted) return;

        const unit = parsePayload(unitRaw);
        const governance = parsePayload(governanceRaw);
        const drivers = parsePayload(driversRaw);

        const trend = mapTrend(unit.trend, unit.previousTrend);

        const kpisRaw = (unit.kpis as Record<string, unknown> | undefined) || {};
        const totalCostRaw = toNumber(kpisRaw.totalCost);
        const totalQuantityRaw = toNumber(kpisRaw.totalQuantity);
        const avgUnitPriceRaw = toNumber(kpisRaw.avgUnitPrice);
        const unitPriceChangePctRaw = toNumber(kpisRaw.unitPriceChangePct);

        const comparison = (unit.comparison as Record<string, unknown> | undefined) || {};
        const currentWindow = (comparison.currentWindow as Record<string, unknown> | undefined) || {};
        const previousWindow = (comparison.previousWindow as Record<string, unknown> | undefined) || {};
        const deltaWindow = (comparison.deltas as Record<string, unknown> | undefined) || {};

        const currentTotalCost = toNumber(currentWindow.totalCost) || totalCostRaw;
        const currentTotalQuantity = toNumber(currentWindow.totalQuantity) || totalQuantityRaw;
        const currentAvgUnitPrice = toNumber(currentWindow.avgUnitPrice) || avgUnitPriceRaw;
        const previousTotalCost = toNumber(previousWindow.totalCost);
        const previousTotalQuantity = toNumber(previousWindow.totalQuantity);
        const previousAvgUnitPrice = toNumber(previousWindow.avgUnitPrice);
        const currentDirectCost = toNumber(currentWindow.directCost);
        const currentSharedCost = toNumber(currentWindow.sharedCost);
        const currentCommitmentBenefit = toNumber(currentWindow.commitmentBenefit);
        const previousSharedCost = toNumber(previousWindow.sharedCost);

        const costGrowthPct = toNumber(deltaWindow.costGrowthPct) || growthPct(currentTotalCost, previousTotalCost);
        const volumeGrowthPct =
          toNumber(deltaWindow.volumeGrowthPct) || growthPct(currentTotalQuantity, previousTotalQuantity);
        const unitPriceChangePct =
          toNumber(deltaWindow.unitCostChangePct) ||
          unitPriceChangePctRaw ||
          growthPct(currentAvgUnitPrice, previousAvgUnitPrice);
        const unitPriceDelta =
          toNumber(deltaWindow.unitCostDelta) || currentAvgUnitPrice - previousAvgUnitPrice;

        const unitPrices = trend.map((row) => row.unitPrice).filter((value) => value > 0);
        const meanUnit =
          unitPrices.length > 0
            ? unitPrices.reduce((sum, value) => sum + value, 0) / unitPrices.length
            : 0;
        const volatilityPct = meanUnit > 0 ? (stdDev(unitPrices) / meanUnit) * 100 : 0;
        const volatilityState: AllocationUnitEconomicsViewModel['kpis']['volatilityState'] =
          volatilityPct >= 35 ? 'high' : volatilityPct >= 20 ? 'medium' : 'low';

        const elasticityScore =
          Math.abs(volumeGrowthPct) >= 0.01 && Number.isFinite(costGrowthPct)
            ? costGrowthPct / volumeGrowthPct
            : null;
        const elasticityClass: AllocationUnitEconomicsViewModel['kpis']['elasticityClass'] =
          elasticityScore === null || !Number.isFinite(elasticityScore)
            ? 'undefined'
            : elasticityScore < 0
              ? 'scale_advantage'
              : elasticityScore < 0.95
                ? 'efficient'
                : elasticityScore <= 1.05
                  ? 'linear'
                  : 'inefficient';
        const elasticityConfidence: AllocationUnitEconomicsViewModel['kpis']['elasticityConfidence'] =
          trend.length >= 21 && volatilityState === 'low'
            ? 'high'
            : trend.length >= 10 && volatilityState !== 'high'
              ? 'medium'
              : 'low';

        const accounts = Array.isArray(governance.accounts)
          ? (governance.accounts as Array<Record<string, unknown>>)
          : [];
        const insights = (governance.insights as Record<string, unknown> | undefined) || {};
        const allocationRaw = (unit.allocation as Record<string, unknown> | undefined) || {};
        const allocationRowsFromApi = mapAllocationRows(allocationRaw.rows);
        const safeTotalSpend = currentTotalCost || toNumber(insights.totalSpend);
        const showbackRows =
          allocationRowsFromApi.length > 0 ? allocationRowsFromApi : buildShowbackRows(accounts, safeTotalSpend);
        const sharedPool =
          allocationRowsFromApi.length > 0
            ? toNumber(allocationRaw.sharedPoolTotal)
            : showbackRows.reduce((sum, row) => sum + row.sharedAllocatedCost, 0);
        const redistributedAmount =
          allocationRowsFromApi.length > 0
            ? toNumber(allocationRaw.redistributedAmount)
            : showbackRows.reduce((sum, row) => sum + row.sharedAllocatedCost, 0);
        const ruleApplied =
          String(allocationRaw.ruleApplied || '').trim() ||
          (sharedPool > 0 ? 'Residual pool redistributed by direct spend share' : 'No shared pool detected');

        const spendWithOwner = toNumber(insights.spendWithOwner);
        const spendWithoutOwner = toNumber(insights.spendWithoutOwner);
        const coverageRaw = (allocationRaw.coverage as Record<string, unknown> | undefined) || {};
        const coverageTeamPctRaw = Object.prototype.hasOwnProperty.call(coverageRaw, 'teamPct')
          ? toNumber(coverageRaw.teamPct)
          : safeTotalSpend > 0
            ? (spendWithOwner / safeTotalSpend) * 100
            : null;
        const coverageOwnerPctRaw = Object.prototype.hasOwnProperty.call(coverageRaw, 'ownerPct')
          ? toNumber(coverageRaw.ownerPct)
          : coverageTeamPctRaw;
        const derivedProductCoverage = deriveProductCoveragePct(showbackRows, safeTotalSpend);
        const coverageProductPctRaw = Object.prototype.hasOwnProperty.call(coverageRaw, 'productPct')
          ? toNumber(coverageRaw.productPct)
          : derivedProductCoverage;
        const coverageTeamPct = clampPct(coverageTeamPctRaw);
        const coverageOwnerPct = clampPct(coverageOwnerPctRaw);
        const coverageProductPct = clampPct(coverageProductPctRaw);

        const status: AllocationUnitEconomicsViewModel['kpis']['status'] =
          trend.length < 4 || previousAvgUnitPrice <= 0
            ? 'insufficient_data'
            : volatilityState === 'high'
              ? 'volatile'
              : unitPriceChangePct <= -2
                ? 'improving'
                : unitPriceChangePct >= 2
                  ? 'degrading'
                  : 'stable';
        const efficiencyStatus: AllocationUnitEconomicsViewModel['kpis']['efficiencyStatus'] =
          status === 'improving'
            ? 'gain'
            : status === 'degrading'
              ? 'drop'
              : status === 'stable'
                ? 'stable'
                : 'insufficient_data';
        const efficiencyInsight =
          status === 'improving'
            ? 'Unit cost is trending down while volume absorbs spend growth.'
            : status === 'degrading'
              ? 'Unit cost is trending up faster than workload scale.'
              : status === 'volatile'
                ? 'Frequent unit-cost swings reduce forecast confidence.'
                : status === 'stable'
                  ? 'Unit cost and workload growth are moving in a controlled band.'
                  : 'Insufficient data for deterministic efficiency conclusion.';

        const decompositionUnit = deriveDecomposition({
          drivers,
          currentQuantity: currentTotalQuantity,
          currentUnitCost: currentAvgUnitPrice,
          previousUnitCost: previousAvgUnitPrice,
          currentSharedCost,
          previousSharedCost,
        });
        const forecast = deriveForecast(trend);
        const target = deriveTarget(currentAvgUnitPrice, previousAvgUnitPrice, currentTotalCost);

        const mainComponent = [...decompositionUnit.components].sort(
          (a, b) => Math.abs(b.value) - Math.abs(a.value),
        )[0];
        const insightClassification: AllocationUnitEconomicsViewModel['kpis']['insightPanel']['classification'] =
          status === 'improving'
            ? 'efficient_scaling'
            : status === 'degrading'
              ? 'degrading_efficiency'
              : status === 'volatile'
                ? 'volatile_behavior'
                : status === 'stable'
                  ? 'linear_scaling'
                  : 'insufficient_data';
        const rootCause = mainComponent
          ? `${mainComponent.label} contributes ${round(mainComponent.value, 6)} to unit-cost shift.`
          : 'No decomposition signal available.';

        const riskFlags: string[] = [];
        if (volatilityState === 'high') riskFlags.push('High unit-cost volatility');
        if (elasticityClass === 'inefficient') riskFlags.push('Cost is scaling faster than volume');
        if (forecast.confidence === 'low') riskFlags.push('Low forecast confidence');
        if (toNumber(target.improvementNeededPct) > 10) riskFlags.push('Target gap exceeds 10%');
        const sharedRatio = currentTotalCost > 0 ? (currentSharedCost / currentTotalCost) * 100 : 0;
        if (sharedRatio > 30) riskFlags.push('High shared allocation dependency');

        const currentStart = formatRangeDate(currentWindow.startDate);
        const currentEnd = formatRangeDate(currentWindow.endDate);
        const previousStart = formatRangeDate(previousWindow.startDate);
        const previousEnd = formatRangeDate(previousWindow.endDate);
        const comparisonLabel =
          currentStart && currentEnd && previousStart && previousEnd
            ? `${mapCompareLabel(controls.compareTo)}: ${currentStart} - ${currentEnd} vs ${previousStart} - ${previousEnd}`
            : `${mapCompareLabel(controls.compareTo)} comparison`;

        const decomposition = (drivers.decomposition as Record<string, unknown> | undefined) || {};
        const tabs = (decomposition.tabs as Record<string, unknown> | undefined) || {};
        const teamRowsRaw = (tabs.team as Record<string, unknown> | undefined)?.rows;
        const serviceRowsRaw = (tabs.service as Record<string, unknown> | undefined)?.rows;
        const teamRows = Array.isArray(teamRowsRaw) ? (teamRowsRaw as Array<Record<string, unknown>>) : [];
        const serviceRows = Array.isArray(serviceRowsRaw)
          ? (serviceRowsRaw as Array<Record<string, unknown>>)
          : [];

        const mapVariance = (rows: Array<Record<string, unknown>>): VarianceRow[] =>
          rows.slice(0, 8).map((row) => ({
            name: String(row.name || row.key || 'Unknown'),
            previous: toNumber(row.previousSpend),
            current: toNumber(row.currentSpend),
            delta: toNumber(row.deltaValue),
            deltaPct: toNumber(row.deltaPercent),
            contributionPct: toNumber(row.contributionScore),
          }));

        const allocationOverviewRaw =
          (unit.allocationOverview as Record<string, unknown> | undefined) || {};
        const allocationConfidenceRaw =
          (unit.allocationConfidence as Record<string, unknown> | undefined) ||
          (allocationOverviewRaw.allocationConfidence as Record<string, unknown> | undefined) ||
          {};
        const confidenceFactors =
          (allocationConfidenceRaw.factors as Record<string, unknown> | undefined) || {};

        const sharedPoolTransparencyRaw =
          (unit.sharedPoolTransparency as Record<string, unknown> | undefined) || {};
        const sharedPoolTransparencyRows = Array.isArray(sharedPoolTransparencyRaw.rows)
          ? (sharedPoolTransparencyRaw.rows as Array<Record<string, unknown>>).map((row) => ({
              sharedCategory: String(row.sharedCategory || 'Shared - Uncategorized'),
              cost: toNumber(row.cost),
              allocationRule: String(row.allocationRule || ruleApplied),
              weightBasis: String(row.weightBasis || 'direct_cost'),
              distributedAmount: toNumber(row.distributedAmount),
              rowCount: toNumber(row.rowCount),
            }))
          : [];

        const unallocatedRaw =
          (unit.unallocatedInsight as Record<string, unknown> | undefined) || {};
        const unallocatedTopServices = Array.isArray(unallocatedRaw.topContributingServices)
          ? (unallocatedRaw.topContributingServices as Array<Record<string, unknown>>).map((row) => ({
              service: String(row.service || 'Unknown Service'),
              amount: toNumber(row.amount),
            }))
          : [];

        const benchmarksRaw = (unit.benchmarks as Record<string, unknown> | undefined) || {};
        const teamProductUnitRows = Array.isArray(benchmarksRaw.teamProduct)
          ? (benchmarksRaw.teamProduct as Array<Record<string, unknown>>).map((row) => ({
              team: String(row.team || 'Unassigned Team'),
              product: String(row.product || 'All Products'),
              volume: toNumber(row.volume),
              finalCost: toNumber(row.finalCost),
              unitCost: toNumber(row.unitCost),
              deltaPct: toNumber(row.deltaPct),
            }))
          : [];
        const environmentUnitRows = Array.isArray(benchmarksRaw.environment)
          ? (benchmarksRaw.environment as Array<Record<string, unknown>>).map((row) => ({
              environment: String(row.environment || 'Unspecified'),
              volume: toNumber(row.volume),
              finalCost: toNumber(row.finalCost),
              unitCost: toNumber(row.unitCost),
              deltaPct: toNumber(row.deltaPct),
            }))
          : [];

        const marginRaw = (unit.margin as Record<string, unknown> | undefined) || {};
        const periodLabel = mapPeriodLabel(controls.period);

        const nextModel: AllocationUnitEconomicsViewModel = {
          kpis: {
            totalCost: round(safeTotalSpend, 2),
            previousTotalCost: round(previousTotalCost, 2),
            directCost: round(currentDirectCost, 2),
            sharedAllocatedCost: round(currentSharedCost, 2),
            commitmentBenefit: round(currentCommitmentBenefit, 2),
            totalQuantity: round(currentTotalQuantity, 2),
            previousTotalQuantity: round(previousTotalQuantity, 2),
            avgUnitPrice: round(currentAvgUnitPrice, 6),
            previousAvgUnitPrice: round(previousAvgUnitPrice, 6),
            unitPriceChangePct: round(unitPriceChangePct, 2),
            unitPriceDelta: round(unitPriceDelta, 6),
            status,
            comparisonLabel,
            elasticityScore:
              elasticityScore !== null && Number.isFinite(elasticityScore)
                ? round(elasticityScore, 4)
                : null,
            elasticityClass,
            elasticityConfidence,
            volatilityPct: round(volatilityPct, 2),
            volatilityState,
            trend,
            efficiencyStatus,
            efficiencyInsight,
            costGrowthPct: round(costGrowthPct, 2),
            volumeGrowthPct: round(volumeGrowthPct, 2),
            decomposition: decompositionUnit,
            forecast,
            target,
            insightPanel: {
              classification: insightClassification,
              rootCause,
              riskFlags,
              summary: efficiencyInsight,
            },
          },
          allocationOverview: {
            totalCloudCost: toNumber(allocationOverviewRaw.totalCloudCost) || round(safeTotalSpend, 2),
            allocatedPct:
              toNumber(allocationOverviewRaw.allocatedPct) ||
              (safeTotalSpend > 0
                ? round(100 - toNumber(unallocatedRaw.unallocatedPct || 0), 2)
                : 0),
            unallocatedPct:
              toNumber(allocationOverviewRaw.unallocatedPct) ||
              (safeTotalSpend > 0
                ? round((Math.max(0, safeTotalSpend - spendWithOwner) / safeTotalSpend) * 100, 2)
                : 0),
            sharedCostPoolAmount: toNumber(allocationOverviewRaw.sharedCostPoolAmount) || round(sharedPool, 2),
            allocationMethod: String(allocationOverviewRaw.allocationMethod || 'direct_spend_weighted'),
            allocationConfidence: {
              score: toNumber(allocationConfidenceRaw.score),
              level:
                String(allocationConfidenceRaw.level || 'low').toLowerCase() === 'high'
                  ? 'high'
                  : String(allocationConfidenceRaw.level || 'low').toLowerCase() === 'medium'
                    ? 'medium'
                    : 'low',
              factors: {
                tagCoveragePct: toNumber(confidenceFactors.tagCoveragePct),
                sharedPoolRatioPct: toNumber(confidenceFactors.sharedPoolRatioPct),
                ruleCompletenessPct: toNumber(confidenceFactors.ruleCompletenessPct),
                dataConsistencyPct: toNumber(confidenceFactors.dataConsistencyPct),
              },
            },
          },
          coverage: {
            team: {
              label: 'Allocated to Team',
              valuePct: coverageTeamPct === null ? null : round(coverageTeamPct, 2),
              state: getCoverageState(coverageTeamPct),
            },
            product: {
              label: 'Allocated to Product',
              valuePct:
                coverageProductPct === null ? null : round(coverageProductPct, 2),
              state: getCoverageState(coverageProductPct),
            },
            owner: {
              label: 'Allocated to Owner',
              valuePct: coverageOwnerPct === null ? null : round(coverageOwnerPct, 2),
              state: getCoverageState(coverageOwnerPct),
            },
            unallocatedAmount: spendWithoutOwner || Math.max(0, safeTotalSpend - spendWithOwner),
            unallocatedPct:
              safeTotalSpend > 0
                ? round(
                    clamp(
                      ((spendWithoutOwner || Math.max(0, safeTotalSpend - spendWithOwner)) /
                        safeTotalSpend) *
                        100,
                      0,
                      100,
                    ),
                    2,
                  )
                : null,
          },
          sharedPool: {
            total: Number(sharedPool.toFixed(2)),
            ruleApplied,
            redistributedAmount: Number(redistributedAmount.toFixed(2)),
            rows: showbackRows,
          },
          sharedPoolTransparency: sharedPoolTransparencyRows,
          unallocatedInsight: {
            unallocatedAmount:
              toNumber(unallocatedRaw.unallocatedAmount) ||
              spendWithoutOwner ||
              Math.max(0, safeTotalSpend - spendWithOwner),
            unallocatedPct:
              toNumber(unallocatedRaw.unallocatedPct) ||
              (safeTotalSpend > 0
                ? round(
                    clamp(
                      ((spendWithoutOwner || Math.max(0, safeTotalSpend - spendWithOwner)) /
                        safeTotalSpend) *
                        100,
                      0,
                      100,
                    ),
                    2,
                  )
                : 0),
            topContributingServices: unallocatedTopServices,
            tagCoveragePct: toNumber(unallocatedRaw.tagCoveragePct) || toNumber(coverageTeamPct),
            governanceMaturity:
              String(unallocatedRaw.governanceMaturity || '').toLowerCase() === 'strong'
                ? 'strong'
                : String(unallocatedRaw.governanceMaturity || '').toLowerCase() === 'medium'
                  ? 'medium'
                  : 'weak',
          },
          showbackRows,
          teamProductUnitRows,
          environmentUnitRows,
          margin: {
            available: Boolean(marginRaw.available),
            revenuePerUnit:
              marginRaw.revenuePerUnit === null || marginRaw.revenuePerUnit === undefined
                ? null
                : toNumber(marginRaw.revenuePerUnit),
            costPerUnit:
              marginRaw.costPerUnit === null || marginRaw.costPerUnit === undefined
                ? null
                : toNumber(marginRaw.costPerUnit),
            marginPerUnit:
              marginRaw.marginPerUnit === null || marginRaw.marginPerUnit === undefined
                ? null
                : toNumber(marginRaw.marginPerUnit),
            marginTrendPct:
              marginRaw.marginTrendPct === null || marginRaw.marginTrendPct === undefined
                ? null
                : toNumber(marginRaw.marginTrendPct),
          },
          teamVariance: mapVariance(teamRows),
          productVariance: mapVariance(serviceRows),
          heatmap: buildHeatmap(showbackRows, safeTotalSpend),
          exportRows: buildExportRows(showbackRows, periodLabel, controls.basis, ruleApplied),
          periodLabel,
          notes: [
            'Product and environment allocation dimensions are currently limited by available backend tags.',
            sharedPool > 0
              ? 'Shared pool uses residual allocation by direct spend share in this version.'
              : 'Shared pool is zero for the selected scope.',
            'Unit economics decomposition maps cost-driver waterfall into per-unit impact with balance correction.',
          ],
        };

        setModel(nextModel);
      } catch (fetchError) {
        console.error('Allocation & Unit Economics load failed:', fetchError);
        if (!mounted) return;
        setError('Failed to load Allocation & Unit Economics data.');
        setModel(DEFAULT_VIEW_MODEL);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [api, caps, requestParams, controls.period, controls.basis, controls.compareTo]);

  return { loading, error, model };
}

