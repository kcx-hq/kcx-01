export type DriverSeverity = 'low' | 'medium' | 'high';

export interface CostDriversApi {
  call: (module: string, action: string, payload?: Record<string, unknown>) => Promise<unknown>;
}

export interface CostDriversCaps {
  modules?: {
    costDrivers?: {
      enabled?: boolean;
    };
  };
}

export interface CostDriversFilters {
  provider?: string;
  service?: string;
  region?: string;
  account?: string;
  subAccount?: string;
  team?: string;
  app?: string;
  env?: string;
  costCategory?: string;
  tagKey?: string;
  tagValue?: string;
}

export interface CostDriversControlsState {
  timeRange: string;
  compareTo: string;
  costBasis: string;
  dimension: string;
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  minChange: number;
  rowLimit: number;
}

export interface KpiInsightContributor {
  name: string;
  deltaValue: number;
  contributionScore: number;
}

export interface KpiInsight {
  title: string;
  summary: string;
  points: string[];
  topContributors?: KpiInsightContributor[];
}

export interface KpiDrilldown {
  type: string;
  target: string;
}

export interface CostDriversKpiCard {
  id: string;
  label: string;
  value: number;
  secondaryValue?: number;
  valueType: 'currency' | 'currency_with_percent' | 'percent';
  formulaId?: string;
  tooltip: string;
  drilldown?: KpiDrilldown;
  sourceMetricIds?: string[];
  insight?: KpiInsight;
}

export interface CostDriversWaterfallStep {
  id: string;
  label: string;
  value: number;
  direction: 'increase' | 'decrease' | 'neutral';
  order: number;
  driverType?: string;
  contributionPctNet?: number;
  contributionAbsPct?: number;
  confidence?: DriverSeverity;
}

export interface CostDriversWaterfall {
  startValue: number;
  endValue: number;
  steps: CostDriversWaterfallStep[];
  validation: {
    computedEnd: number;
    expectedEnd: number;
    deltaDifference: number;
    isBalanced: boolean;
  };
}

export interface CostDriversDecompositionRow {
  id?: string;
  key: string;
  name: string;
  dimension?: string;
  previousSpend: number;
  currentSpend: number;
  deltaValue: number;
  deltaPercent: number;
  deltaPercentDisplay?: string;
  isNewSpend?: boolean;
  isRemovedSpend?: boolean;
  contributionPercent: number;
  contributionScore: number;
  driverType: string;
  riskLevel: DriverSeverity;
  unexplainedContribution: number;
  driverBreakdown?: {
    newServicesResources?: number;
    usageGrowth?: number;
    ratePriceChange?: number;
    mixShift?: number;
    creditsDiscountChange?: number;
    savingsRemovals?: number;
  };
  evidencePayload?: {
    dimension: string;
    driverKey: string;
  };
  detailsPayload?: {
    dimension?: string;
    driverKey?: string;
  };
  deepLinks?: {
    billingExplorer: string;
    resourceExplorer: string;
    optimization: string;
  };
}

export interface CostDriversTopDriverRow {
  dimension: string;
  key: string;
  name: string;
  deltaValue: number;
  deltaPercent: number;
  contributionPercent: number;
  confidence: "High" | "Medium" | "Low" | string;
  riskLevel: DriverSeverity;
  evidenceSummary: string;
  evidencePayload?: {
    dimension: string;
    driverKey: string;
  };
}

export interface CostDriversRateVsUsageRow {
  key: string;
  name: string;
  usageEffectValue: number;
  rateEffectValue: number;
  interactionValue: number;
  totalDeltaValue: number;
  confidence: "High" | "Medium" | "Low" | string;
  evidenceSummary: string;
}

export interface CostDriversRateVsUsageModel {
  supported: boolean;
  supportReason: string;
  coveragePercent: number;
  summary: {
    usageEffectValue: number;
    rateEffectValue: number;
    interactionValue: number;
    totalExplainedFromSplit: number;
  };
  interpretation: string;
  rows: CostDriversRateVsUsageRow[];
}

export interface CostDriversDecompositionTab {
  title: string;
  rows: CostDriversDecompositionRow[];
  totalRows: number;
  noiseThresholdApplied: number;
  omittedByThreshold?: number;
  omittedByRowLimit?: number;
}

export interface CostDriversTrendPoint {
  index: number;
  date: string;
  currentSpend: number;
  previousSpend: number;
  deltaValue: number;
  explainedValue: number;
  residualValue: number;
  residualAbsPctOfDelta: number;
  driverTags: string[];
}

export interface CostDriversResponse {
  schemaVersion?: string;
  controls: {
    timeRange: string;
    compareTo: string;
    costBasis: string;
    startDate: string | null;
    endDate: string | null;
    previousStartDate: string | null;
    previousEndDate: string | null;
    activeDimension?: string;
    options?: {
      timeRanges?: string[];
      compareTo?: string[];
      costBasis?: string[];
      dimensions?: string[];
    };
  };
  periodWindows?: {
    current?: { startDate: string | null; endDate: string | null; days: number };
    previous?: { startDate: string | null; endDate: string | null; days: number };
    latestBillingDate?: string | null;
  };
  varianceSummary: {
    previousPeriodSpend: number;
    currentPeriodSpend: number;
    netChange: number;
    netChangePercent: number;
    explainedPercent: number;
    top3ContributorsPercent: number;
    explainedValue: number;
    unexplainedValue: number;
  };
  kpiStrip: CostDriversKpiCard[];
  waterfall: CostDriversWaterfall;
  trendComparison?: {
    granularity: 'daily' | 'weekly' | 'monthly';
    series: CostDriversTrendPoint[];
    residualOverlay: {
      unexplainedValue: number;
      unexplainedPercentOfNet: number;
      thresholdPercent: number;
      alert: boolean;
      severity: DriverSeverity;
    };
    windows: {
      current: { startDate: string | null; endDate: string | null; days: number };
      previous: { startDate: string | null; endDate: string | null; days: number };
    };
  };
  decomposition: {
    activeTab: string;
    tabs: Record<string, CostDriversDecompositionTab>;
    materiality?: {
      thresholdValue: number;
      thresholdRule: string;
    };
  };
  topDrivers?: CostDriversTopDriverRow[];
  rateVsUsage?: CostDriversRateVsUsageModel;
  unexplainedVariance: {
    value: number;
    modelResidualValue?: number;
    roundingResidualValue?: number;
    percentOfNetChange: number;
    severity: DriverSeverity;
    thresholdPercent: number;
    governanceWarnings: string[];
    checks: Record<string, unknown>;
  };
  attributionConfidence?: {
    score: number;
    level: DriverSeverity;
    rules: Array<{ id: string; label: string; status: string; detail?: string }>;
    signals?: Record<string, unknown>;
  };
  runMeta?: {
    runId: string | null;
    generatedAt: string | null;
    engineVersion: string | null;
    sourceSignature: string | null;
    rowLimitApplied: number;
    uploadCount: number;
    uploadIds: string[];
    rawRowCount: number;
    scopedRowCount: number;
    rowsInWindow: number;
    rowsExcludedFuture: number;
    creditRowsInWindow: number;
    nonCreditRowsInWindow: number;
  };
  executiveInsights: {
    bullets: Array<{
      id: string;
      severity: DriverSeverity;
      title: string;
      detail: string;
      evidencePayload?: { dimension: string; driverKey: string };
      sourceMetricIds?: string[];
    }>;
  };
  trust: {
    checks: Record<string, unknown>;
    riskLevel: DriverSeverity;
  };
  drilldown?: {
    activeDimension: string;
    topRows: CostDriversDecompositionRow[];
    detailApi: string;
  };
  message?: string;
}

export interface CostDriverDetailPayload {
  summary: {
    key: string;
    dimension: string;
    driverType: string;
    previousSpend: number;
    currentSpend: number;
    deltaValue: number;
    deltaPercent: number;
    contributionScore: number;
    contributionPercent: number;
    unexplainedContribution: number;
    riskLevel: DriverSeverity;
  } | null;
  trend: Array<{
    date: string;
    currentSpend: number;
    previousSpend: number;
    deltaValue: number;
  }>;
  resourceBreakdown: Array<{
    resourceId: string;
    resourceName: string;
    previousSpend: number;
    currentSpend: number;
    deltaValue: number;
    deltaPercent: number;
  }>;
  topSkuChanges: Array<{
    sku: string;
    previousSpend: number;
    currentSpend: number;
    deltaValue: number;
    deltaPercent: number;
  }>;
  trendData: Array<{ date: string; val: number }>;
  subDrivers: Array<{ name: string; value: number }>;
  topResources: Array<{ id: string; displayName: string; cost: number }>;
  annualizedImpact: number;
  insightText: string;
  links: {
    billingExplorer: string;
    resourceExplorer: string;
    optimization: string;
  };
  actionPayload: {
    title: string;
    owner: string;
    expectedImpact: number;
    confidence: string;
    source: string;
    dimension: string;
    driverKey: string;
  } | null;
}

export type CostDriversTrendComparison = NonNullable<CostDriversResponse['trendComparison']>;
export type CostDriversDecompositionModel = CostDriversResponse['decomposition'];
export type CostDriversUnexplainedVariance = CostDriversResponse['unexplainedVariance'];
export type CostDriversAttributionConfidence = NonNullable<CostDriversResponse['attributionConfidence']>;
export type CostDriversRunMeta = NonNullable<CostDriversResponse['runMeta']>;
export type CostDriversExecutiveInsights = CostDriversResponse['executiveInsights'];

export interface CostDriversViewProps {
  api: unknown;
  caps: CostDriversCaps;
  loading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  controlsState: {
    timeRange: string;
    compareTo: string;
    costBasis: string;
    dimension: string;
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  };
  onControlsChange: (patch: Record<string, unknown>) => void;
  onResetControls: () => void;
  kpiStrip: CostDriversKpiCard[];
  activeKpiId: string | null;
  onToggleKpi: (id: string) => void;
  waterfall: CostDriversWaterfall;
  decomposition: CostDriversDecompositionModel;
  topDrivers: CostDriversTopDriverRow[];
  rateVsUsage: CostDriversRateVsUsageModel;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenDriver: (row: CostDriversDecompositionRow) => void;
  unexplainedVariance: CostDriversUnexplainedVariance;
  attributionConfidence: CostDriversAttributionConfidence;
  runMeta: CostDriversRunMeta;
  trust: { riskLevel: DriverSeverity };
  executiveInsights: CostDriversExecutiveInsights;
  selectedDriver: CostDriversDecompositionRow | null;
  details: CostDriverDetailPayload;
  detailLoading: boolean;
  onCloseDetails: () => void;
}
