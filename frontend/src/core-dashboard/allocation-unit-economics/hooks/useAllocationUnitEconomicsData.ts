import { useEffect, useMemo, useState } from 'react';
import type {
  AllocationUnitEconomicsControls,
  AllocationUnitEconomicsViewModel,
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
  denominatorGate: {
    status: 'fail',
    reasons: ['No denominator volume found in selected scope.'],
    metric: 'consumed_quantity',
    quantityCoveragePct: 0,
  },
  trust: {
    dataFreshnessTs: null,
    coveragePct: 0,
    confidenceLevel: 'low',
  },
  ownershipDrift: {
    series: [],
    flags: [],
  },
  unitMetricDefinitions: {
    selectedMetric: 'consumed_quantity',
    availableMetrics: [{ key: 'consumed_quantity', label: 'Consumed Quantity' }],
  },
  periodLabel: 'N/A',
  notes: [
    'Allocation and unit economics data is unavailable for selected scope.',
  ],
};

const parsePayload = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
};

const mapPeriod = (period: AllocationUnitEconomicsControls['period']): string => {
  if (period === '90d') return 'last90days';
  if (period === 'month') return 'month';
  return 'last30days';
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<AllocationUnitEconomicsViewModel>(DEFAULT_VIEW_MODEL);

  const requestParams = useMemo(
    () => ({
      provider: filters.provider && filters.provider !== 'All' ? filters.provider : undefined,
      service: filters.service && filters.service !== 'All' ? filters.service : undefined,
      region: filters.region && filters.region !== 'All' ? filters.region : undefined,
      period: mapPeriod(controls.period),
      compareTo: controls.compareTo,
      costBasis: controls.basis,
      unitMetric: controls.unitMetric || 'consumed_quantity',
    }),
    [filters.provider, filters.service, filters.region, controls.period, controls.compareTo, controls.basis, controls.unitMetric],
  );

  useEffect(() => {
    const modules = (caps as { modules?: Record<string, { enabled?: boolean }> } | null)?.modules || {};
    const canUnitEconomics = Boolean(modules.unitEconomics?.enabled);

    if (!api || !caps || !canUnitEconomics) {
      setLoading(false);
      setRefreshing(false);
      setError(null);
      setModel(DEFAULT_VIEW_MODEL);
      return;
    }

    let mounted = true;
    setRefreshing(!loading);
    if (loading) setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const raw = await api.call('unitEconomics', 'summary', { params: requestParams });
        if (!mounted) return;

        const payload = parsePayload(raw);
        const viewModel = payload.viewModel as AllocationUnitEconomicsViewModel | undefined;
        if (viewModel && typeof viewModel === 'object') {
          setModel(viewModel);
        } else {
          setModel(DEFAULT_VIEW_MODEL);
          setError('Unit economics view model is missing from backend response.');
        }
      } catch (fetchError) {
        console.error('Allocation & Unit Economics load failed:', fetchError);
        if (!mounted) return;
        setError('Failed to load Allocation & Unit Economics data.');
        setModel(DEFAULT_VIEW_MODEL);
      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [api, caps, requestParams]);

  return { loading, refreshing, error, model };
}

