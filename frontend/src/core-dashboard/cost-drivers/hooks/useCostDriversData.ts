import { useEffect, useMemo, useRef, useState } from 'react';
import { useDashboardStore } from '../../../store/Dashboard.store';
import {
  DEFAULT_DYNAMICS,
  DEFAULT_OVERALL_STATS,
  DEFAULT_PERIODS,
} from '../utils/constants';
import type {
  CostDriversApi,
  CostDriversCaps,
  CostDriversFilters,
  CostDriversKpiCard,
  CostDriversResponse,
  CostDriversTrendPoint,
  CostDriversWaterfall,
  DriverSeverity,
} from '../types';

const DEFAULT_VARIANCE_SUMMARY = {
  previousPeriodSpend: 0,
  currentPeriodSpend: 0,
  netChange: 0,
  netChangePercent: 0,
  explainedPercent: 0,
  top3ContributorsPercent: 0,
  explainedValue: 0,
  unexplainedValue: 0,
};

const DEFAULT_UNEXPLAINED = {
  value: 0,
  modelResidualValue: 0,
  roundingResidualValue: 0,
  percentOfNetChange: 0,
  severity: 'low',
  thresholdPercent: 5,
  governanceWarnings: [],
  checks: {},
};

const DEFAULT_ATTRIBUTION_CONFIDENCE = {
  score: 0,
  level: 'low',
  rules: [],
  signals: {},
};

const DEFAULT_RUN_META = {
  runId: null,
  generatedAt: null,
  engineVersion: null,
  sourceSignature: null,
  rowLimitApplied: 0,
  uploadCount: 0,
  uploadIds: [],
  rawRowCount: 0,
  scopedRowCount: 0,
  rowsInWindow: 0,
  rowsExcludedFuture: 0,
  creditRowsInWindow: 0,
  nonCreditRowsInWindow: 0,
  dayCoverage: {
    availableDays: 0,
    currentDays: 0,
    previousDays: 0,
    firstBillingDate: null,
    latestBillingDate: null,
  },
  filterScope: {},
};

const DEFAULT_DECOMPOSITION = {
  activeTab: 'service',
  tabs: {
    service: { title: 'By Service', rows: [], totalRows: 0, noiseThresholdApplied: 0, omittedByThreshold: 0, omittedByRowLimit: 0 },
    account: { title: 'By Account', rows: [], totalRows: 0, noiseThresholdApplied: 0, omittedByThreshold: 0, omittedByRowLimit: 0 },
    region: { title: 'By Region', rows: [], totalRows: 0, noiseThresholdApplied: 0, omittedByThreshold: 0, omittedByRowLimit: 0 },
    team: { title: 'By Team', rows: [], totalRows: 0, noiseThresholdApplied: 0, omittedByThreshold: 0, omittedByRowLimit: 0 },
    sku: { title: 'By SKU', rows: [], totalRows: 0, noiseThresholdApplied: 0, omittedByThreshold: 0, omittedByRowLimit: 0 },
  },
  materiality: {
    thresholdValue: 0,
    thresholdRule: 'max(userMinChange, 0.5% of |net change|, 0.01)',
  },
};

const DEFAULT_TREND_COMPARISON = {
  granularity: 'daily' as const,
  series: [] as CostDriversTrendPoint[],
  residualOverlay: {
    unexplainedValue: 0,
    unexplainedPercentOfNet: 0,
    thresholdPercent: 5,
    alert: false,
    severity: 'low' as DriverSeverity,
  },
  windows: {
    current: { startDate: null, endDate: null, days: 0 },
    previous: { startDate: null, endDate: null, days: 0 },
  },
};

const normalizePeriods = (raw) => {
  if (!raw || typeof raw !== 'object') return DEFAULT_PERIODS;
  return {
    current: raw.current ? new Date(raw.current) : null,
    prev: raw.prev ? new Date(raw.prev) : null,
    max: raw.max ? new Date(raw.max) : null,
  };
};

interface UseCostDriversDataInput {
  api?: CostDriversApi;
  caps?: CostDriversCaps;
  filters?: CostDriversFilters;
  period?: number;
  dimension?: string;
  minChange?: number;
  debouncedFilters?: CostDriversFilters;
  debouncedPeriod?: number;
  debouncedDimension?: string;
  debouncedMinChange?: number;
  timeRange?: string;
  compareTo?: string;
  costBasis?: string;
  startDate?: string | null;
  endDate?: string | null;
  previousStartDate?: string | null;
  previousEndDate?: string | null;
  rowLimit?: number;
}

interface UseCostDriversDataResult {
  loading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  increases: Array<Record<string, unknown>>;
  decreases: Array<Record<string, unknown>>;
  overallStats: typeof DEFAULT_OVERALL_STATS;
  dynamics: typeof DEFAULT_DYNAMICS;
  periods: typeof DEFAULT_PERIODS;
  availableServices: string[];
  controls: Record<string, unknown>;
  periodWindows: Record<string, unknown>;
  varianceSummary: typeof DEFAULT_VARIANCE_SUMMARY;
  kpiStrip: CostDriversKpiCard[];
  waterfall: CostDriversWaterfall;
  decomposition: typeof DEFAULT_DECOMPOSITION;
  trendComparison: typeof DEFAULT_TREND_COMPARISON;
  unexplainedVariance: typeof DEFAULT_UNEXPLAINED;
  attributionConfidence: typeof DEFAULT_ATTRIBUTION_CONFIDENCE;
  runMeta: typeof DEFAULT_RUN_META;
  executiveInsights: { bullets: Array<Record<string, unknown>> };
  trust: { checks: Record<string, unknown>; riskLevel: DriverSeverity };
  drilldown: { activeDimension: string; topRows: Array<Record<string, unknown>>; detailApi: string };
}

export function useCostDriversData(input: UseCostDriversDataInput): UseCostDriversDataResult {
  const {
    api,
    caps,
    filters = {},
    period = 30,
    dimension = 'service',
    minChange = 0,
    debouncedFilters,
    debouncedPeriod,
    debouncedDimension,
    debouncedMinChange,
    timeRange,
    compareTo,
    costBasis,
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
    rowLimit = 100,
  } = input || {};

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [increases, setIncreases] = useState<Array<Record<string, unknown>>>([]);
  const [decreases, setDecreases] = useState<Array<Record<string, unknown>>>([]);
  const [overallStats, setOverallStats] = useState(DEFAULT_OVERALL_STATS);
  const [dynamics, setDynamics] = useState(DEFAULT_DYNAMICS);
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [availableServices, setAvailableServices] = useState<string[]>(['All']);

  const [controls, setControls] = useState<Record<string, unknown>>({
    timeRange: '30d',
    compareTo: 'previous_period',
    costBasis: 'actual',
    startDate: null,
    endDate: null,
    previousStartDate: null,
    previousEndDate: null,
    activeDimension: 'service',
    options: {
      timeRanges: ['7d', '30d', '90d', 'mtd', 'qtd', 'custom'],
      compareTo: ['previous_period', 'same_period_last_month', 'custom_previous', 'none'],
      costBasis: ['actual', 'amortized', 'net'],
      dimensions: ['service', 'account', 'region', 'team', 'sku'],
    },
  });
  const [periodWindows, setPeriodWindows] = useState<Record<string, unknown>>({
    current: null,
    previous: null,
    latestBillingDate: null,
  });
  const [varianceSummary, setVarianceSummary] = useState(DEFAULT_VARIANCE_SUMMARY);
  const [kpiStrip, setKpiStrip] = useState<CostDriversKpiCard[]>([]);
  const [waterfall, setWaterfall] = useState<CostDriversWaterfall>({
    startValue: 0,
    endValue: 0,
    steps: [],
    validation: { computedEnd: 0, expectedEnd: 0, deltaDifference: 0, isBalanced: true },
  });
  const [decomposition, setDecomposition] = useState(DEFAULT_DECOMPOSITION);
  const [trendComparison, setTrendComparison] = useState(DEFAULT_TREND_COMPARISON);
  const [unexplainedVariance, setUnexplainedVariance] = useState(DEFAULT_UNEXPLAINED);
  const [attributionConfidence, setAttributionConfidence] = useState(DEFAULT_ATTRIBUTION_CONFIDENCE);
  const [runMeta, setRunMeta] = useState(DEFAULT_RUN_META);
  const [executiveInsights, setExecutiveInsights] = useState<{ bullets: Array<Record<string, unknown>> }>({ bullets: [] });
  const [trust, setTrust] = useState<{ checks: Record<string, unknown>; riskLevel: DriverSeverity }>({ checks: {}, riskLevel: 'low' });
  const [drilldown, setDrilldown] = useState<{ activeDimension: string; topRows: Array<Record<string, unknown>>; detailApi: string }>({
    activeDimension: 'service',
    topRows: [],
    detailApi: '/analytics/cost-drivers/details',
  });

  const isInitialMount = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadIds = useDashboardStore((state) => state.uploadIds);
  const uploadIdsKey = (Array.isArray(uploadIds) ? uploadIds.join(',') : '') || '';

  const resolvedFilters = useMemo(() => debouncedFilters || filters, [debouncedFilters, filters]);
  const resolvedPeriod = debouncedPeriod ?? period;
  const resolvedDimension = debouncedDimension || dimension;
  const resolvedMinChange = debouncedMinChange ?? minChange;
  const resolvedTimeRange = timeRange || `${Math.max(1, Number(resolvedPeriod) || 30)}d`;
  const resolvedCompareTo = compareTo || 'previous_period';
  const resolvedCostBasis = costBasis || 'actual';

  useEffect(() => {
    if (!api || !caps || !caps.modules?.costDrivers?.enabled) return undefined;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const fetchData = async () => {
      if (isInitialMount.current) setLoading(true);
      else setIsRefreshing(true);
      setErrorMessage(null);

      try {
        const data = await api.call<unknown>('costDrivers', 'costDrivers', {
          params: {
            provider: resolvedFilters.provider !== 'All' ? resolvedFilters.provider : undefined,
            service: resolvedFilters.service !== 'All' ? resolvedFilters.service : undefined,
            region: resolvedFilters.region !== 'All' ? resolvedFilters.region : undefined,
            account: resolvedFilters.account !== 'All' ? resolvedFilters.account : undefined,
            subAccount: resolvedFilters.subAccount !== 'All' ? resolvedFilters.subAccount : undefined,
            team: resolvedFilters.team !== 'All' ? resolvedFilters.team : undefined,
            app: resolvedFilters.app !== 'All' ? resolvedFilters.app : undefined,
            env: resolvedFilters.env !== 'All' ? resolvedFilters.env : undefined,
            costCategory: resolvedFilters.costCategory !== 'All' ? resolvedFilters.costCategory : undefined,
            tagKey: resolvedFilters.tagKey || undefined,
            tagValue: resolvedFilters.tagValue || undefined,
            period: resolvedPeriod,
            timeRange: resolvedTimeRange,
            compareTo: resolvedCompareTo,
            costBasis: resolvedCostBasis,
            startDate: resolvedTimeRange === 'custom' ? startDate || undefined : undefined,
            endDate: resolvedTimeRange === 'custom' ? endDate || undefined : undefined,
            previousStartDate:
              resolvedCompareTo === 'custom_previous' ? previousStartDate || undefined : undefined,
            previousEndDate:
              resolvedCompareTo === 'custom_previous' ? previousEndDate || undefined : undefined,
            dimension: resolvedDimension,
            minChange: resolvedMinChange,
            rowLimit,
          },
        }) as { success?: boolean; data?: unknown };

        if (abortControllerRef.current?.signal.aborted) return;

        const payload = ((data && typeof data === 'object' ? data : {}) as Partial<CostDriversResponse>) as Partial<
          CostDriversResponse
        > & {
          increases?: Array<Record<string, unknown>>;
          decreases?: Array<Record<string, unknown>>;
          overallStats?: typeof DEFAULT_OVERALL_STATS;
          dynamics?: typeof DEFAULT_DYNAMICS;
          periodsLegacy?: {
            current?: string;
            prev?: string;
            max?: string;
          };
          availableServices?: string[];
          controls?: Record<string, unknown>;
          periodWindows?: Record<string, unknown>;
          decomposition?: typeof DEFAULT_DECOMPOSITION;
        };

        setIncreases(Array.isArray(payload.increases) ? payload.increases : []);
        setDecreases(Array.isArray(payload.decreases) ? payload.decreases : []);
        setOverallStats(payload.overallStats || DEFAULT_OVERALL_STATS);
        setDynamics(payload.dynamics || DEFAULT_DYNAMICS);
        setPeriods(normalizePeriods(payload.periods || payload.periodsLegacy));

        if (Array.isArray(payload.availableServices) && payload.availableServices.length > 0) {
          setAvailableServices(['All', ...payload.availableServices]);
        } else {
          setAvailableServices(['All']);
        }

        setControls(payload.controls || controls);
        setPeriodWindows(payload.periodWindows || periodWindows);
        setVarianceSummary(payload.varianceSummary || DEFAULT_VARIANCE_SUMMARY);
        setKpiStrip(Array.isArray(payload.kpiStrip) ? payload.kpiStrip : []);
        setWaterfall(
          payload.waterfall || {
            startValue: 0,
            endValue: 0,
            steps: [],
            validation: { computedEnd: 0, expectedEnd: 0, deltaDifference: 0, isBalanced: true },
          },
        );
        setTrendComparison(payload.trendComparison || DEFAULT_TREND_COMPARISON);
        setDecomposition(payload.decomposition || DEFAULT_DECOMPOSITION);
        setUnexplainedVariance(payload.unexplainedVariance || DEFAULT_UNEXPLAINED);
        setAttributionConfidence(payload.attributionConfidence || DEFAULT_ATTRIBUTION_CONFIDENCE);
        setRunMeta(payload.runMeta || DEFAULT_RUN_META);
        setExecutiveInsights(payload.executiveInsights || { bullets: [] });
        setTrust(payload.trust || { checks: {}, riskLevel: 'low' });
        setDrilldown(
          payload.drilldown || {
            activeDimension: resolvedDimension,
            topRows: [],
            detailApi: '/analytics/cost-drivers/details',
          },
        );

        setErrorMessage(payload.message || null);
      } catch (error) {
        const err = error as { name?: string };
        if (err?.name === 'AbortError') return;
        if (!abortControllerRef.current?.signal.aborted) {
          setErrorMessage('Error loading cost drivers. Please try again.');
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
          setIsRefreshing(false);
          if (isInitialMount.current) isInitialMount.current = false;
        }
      }
    };

    fetchData();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [
    api,
    caps,
    uploadIdsKey,
    resolvedFilters,
    resolvedPeriod,
    resolvedDimension,
    resolvedMinChange,
    resolvedTimeRange,
    resolvedCompareTo,
    resolvedCostBasis,
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
    rowLimit,
  ]);

  return {
    loading,
    isRefreshing,
    errorMessage,

    increases,
    decreases,
    overallStats,
    dynamics,
    periods,
    availableServices,

    controls,
    periodWindows,
    varianceSummary,
    kpiStrip,
    waterfall,
    trendComparison,
    decomposition,
    unexplainedVariance,
    attributionConfidence,
    runMeta,
    executiveInsights,
    trust,
    drilldown,
  };
}



