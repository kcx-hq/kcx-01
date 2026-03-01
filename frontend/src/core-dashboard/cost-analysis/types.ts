export type CostBasis = "actual" | "amortized" | "net";
export type TimeRangePreset = "7d" | "30d" | "90d" | "mtd" | "qtd" | "custom";
export type Granularity = "daily" | "weekly" | "monthly";
export type CompareTo = "previous_period" | "same_period_last_month" | "none";
export type CurrencyMode = "usd";
export type SpendAnalyticsGroupBy =
  | "ServiceName"
  | "RegionName"
  | "ProviderName"
  | "Account"
  | "Team"
  | "App"
  | "Env"
  | "CostCategory";

export interface SpendAnalyticsFilters {
  provider: string;
  service: string;
  region: string;
  account: string;
  subAccount: string;
  app: string;
  team: string;
  env: string;
  costCategory: string;
  tagKey: string;
  tagValue: string;
  timeRange: TimeRangePreset;
  granularity: Granularity;
  compareTo: CompareTo;
  costBasis: CostBasis;
  currencyMode: CurrencyMode;
  groupBy: SpendAnalyticsGroupBy;
  startDate: string;
  endDate: string;
}

export type SpendAnalyticsFilterPatch = Partial<SpendAnalyticsFilters>;

export interface CostAnalysisFilterOptions {
  providers: string[];
  services: string[];
  regions: string[];
  accounts: string[];
  subAccounts: string[];
  costCategories: string[];
  apps: string[];
  teams: string[];
  envs: string[];
  currencyModes: CurrencyMode[];
  tagKeys: string[];
}

export interface TrendSeriesPoint {
  date: string;
  total: number;
  previousTotal: number;
  deltaValue: number;
  deltaPercent: number;
  isAnomaly?: boolean;
  anomalyImpact?: number;
  [seriesName: string]: string | number | boolean | undefined;
}

export interface BreakdownRow {
  name: string;
  spend: number;
  sharePercent: number;
  deltaValue: number;
  deltaPercent: number;
  compareLabel: string;
  drilldownLink: string;
  pinFilter: Record<string, string>;
  isOthers?: boolean;
  memberCount?: number;
}

export interface SpendAnomalyItem {
  id: string;
  detectedAt: string;
  impact: number;
  confidence: string;
  serviceHint: string;
  regionHint: string;
  accountHint: string;
  topContributors: Array<{ name: string; spend: number }>;
  baselineBefore: number;
  actualAfter: number;
  likelyDrivers: string[];
  billingExplorerLink: string;
}

export interface SpendTopMoverItem {
  name: string;
  deltaValue: number;
  deltaPercent: number;
  direction: "increase" | "decrease";
}

export interface SpendAnalyticsTrustCue {
  lastUpdatedAt: string | null;
  freshnessHours: number | null;
  coveragePercent: number;
  providerCoverage: number;
  serviceCoverage: number;
  regionCoverage: number;
  confidence: "High" | "Medium" | "Low" | string;
  scopedRows: number;
  totalRows: number;
}

export interface SpendAnalyticsKpiCard {
  key: string;
  title: string;
  value: number;
  valueType?: "currency" | "percent" | "number";
  status: "on_track" | "watch" | "critical" | string;
  comparison: {
    label: string;
    deltaValue: number;
    deltaPercent: number;
  };
  context?: {
    peakDate?: string | null;
    insightPoints?: string[];
  };
  trust?: {
    confidence: string;
    freshnessHours: number | null;
    coveragePercent: number;
  };
}

export interface SpendAnalyticsPayload {
  controls: {
    timeRange: TimeRangePreset | string;
    granularity: Granularity | string;
    compareTo: CompareTo | string;
    costBasis: CostBasis | string;
    currencyMode: CurrencyMode | string;
    groupBy: SpendAnalyticsGroupBy | string;
    startDate: string | null;
    endDate: string | null;
    options: {
      timeRanges: TimeRangePreset[] | string[];
      granularities: Granularity[] | string[];
      compareTo: CompareTo[] | string[];
      costBasis: CostBasis[] | string[];
      currencyModes: CurrencyMode[] | string[];
      groupBy: SpendAnalyticsGroupBy[] | string[];
    };
  };
  trust: SpendAnalyticsTrustCue;
  kpiDeck: {
    cards: SpendAnalyticsKpiCard[];
    totalSpend: number;
    avgDailySpend: number;
    peakDailySpend: number;
    trendPercent: number;
    topConcentrationShare: number;
    anomalyImpact: number;
  };
  spendDistribution: {
    kpiStrip: {
      totalScopedSpend: number;
      topServiceSharePct: number;
      topRegionSharePct: number;
      top3SharePct: number;
      concentrationBand: "on_track" | "warning" | "critical" | string;
    };
    compareLabel: string;
    compareRows: Array<{
      dimension: "service" | "region" | "provider" | "account" | string;
      name: string;
      currentSpend: number;
      previousSpend: number;
      deltaValue: number;
      deltaPercent: number;
      sharePercent: number;
      drillLinks: {
        costAnalysis: string;
        costDrivers: string;
        optimization: string;
      };
    }>;
  };
  trend: {
    granularity: Granularity | string;
    compareLabel: string;
    activeKeys: string[];
    series: TrendSeriesPoint[];
  };
  breakdown: {
    activeDimension: string;
    byProvider: BreakdownRow[];
    byService: BreakdownRow[];
    byRegion: BreakdownRow[];
    byAccount: BreakdownRow[];
    byTeam: BreakdownRow[];
    byApp: BreakdownRow[];
    byEnv: BreakdownRow[];
    byCostCategory: BreakdownRow[];
    preview: BreakdownRow[];
  };
  concentration: {
    topServiceShare: number;
    topProviderShare: number;
    top3ServiceShare: number;
    top5ServiceShare: number;
    paretoByService: Array<{
      name: string;
      spend: number;
      sharePercent: number;
      cumulativeSharePercent: number;
    }>;
    paretoByProvider: Array<{
      name: string;
      spend: number;
      sharePercent: number;
      cumulativeSharePercent: number;
    }>;
  };
  anomalyImpact: {
    impactTotal: number;
    shareOfSpend: number;
    cards: Array<{
      id: string;
      title: string;
      impactToDate: number;
      detectedAt: string;
      windowStart: string;
      windowEnd: string;
      confidence: string;
      severity: string;
      likelyDrivers: string[];
    }>;
    markers: Array<{ date: string; impact: number; confidence: string }>;
  };
  topMovers?: SpendTopMoverItem[];
  anomalyDetection: {
    threshold: number;
    mean: number;
    stdDev: number;
    impactTotal: number;
    markers: Array<{ date: string; impact: number; confidence: string }>;
    list: SpendAnomalyItem[];
    highlights?: SpendAnomalyItem[];
  };
  concentrationPareto: {
    top10ServicesShare: number;
    top3AccountsShare: number;
    singleRegionShare: number;
    topServices: Array<{ name: string; value: number }>;
    topAccounts: Array<{ name: string; value: number }>;
    topRegions: Array<{ name: string; value: number }>;
  };
  routes: {
    overview: string;
    breakdownExplorer: string;
    concentration: string;
    anomalyImpact: string;
  };
  drilldownPaths: {
    overview: string;
    breakdownExplorer: string;
    concentration: string;
    anomalyImpact: string;
  };
}

export interface CostAnalysisApiData {
  kpis?: {
    totalSpend?: number;
    avgDaily?: number;
    peakUsage?: number;
    peakDate?: string | null;
    trend?: number;
    forecastTotal?: number;
    atRiskSpend?: number;
  };
  chartData?: Array<Record<string, number | string>>;
  predictabilityChartData?: Array<Record<string, number | string>>;
  anomalies?: Array<Record<string, unknown>>;
  activeKeys?: string[];
  drivers?: Array<Record<string, unknown>>;
  riskData?: Array<Record<string, unknown>>;
  breakdown?: Array<{ name: string; value: number }>;
  spendAnalytics?: SpendAnalyticsPayload;
  message?: string;
}

export interface CostAnalysisCaps {
  modules?: {
    costAnalysis?: {
      enabled?: boolean;
      endpoints?: {
        costAnalysis?: unknown;
        costAnalysisKpis?: unknown;
        costAnalysisTrend?: unknown;
        costAnalysisBreakdown?: unknown;
        costAnalysisConcentration?: unknown;
        costAnalysisAnomalyImpact?: unknown;
        costFilters?: unknown;
      };
    };
  };
}

export interface ApiCallOptions {
  params?: Record<string, string | number | boolean | undefined>;
  data?: unknown;
  headers?: Record<string, string>;
  responseType?: string;
  signal?: AbortSignal;
}

export interface CostAnalysisApiClient {
  call: (
    moduleKey: string,
    endpointKey: string,
    options?: ApiCallOptions
  ) => Promise<unknown>;
}

export const defaultSpendAnalyticsFilters: SpendAnalyticsFilters = {
  provider: "All",
  service: "All",
  region: "All",
  account: "All",
  subAccount: "All",
  app: "All",
  team: "All",
  env: "All",
  costCategory: "All",
  tagKey: "",
  tagValue: "",
  timeRange: "30d",
  granularity: "daily",
  compareTo: "previous_period",
  costBasis: "actual",
  currencyMode: "usd",
  groupBy: "ServiceName",
  startDate: "",
  endDate: "",
};

export const defaultCostAnalysisFilterOptions: CostAnalysisFilterOptions = {
  providers: ["All"],
  services: ["All"],
  regions: ["All"],
  accounts: ["All"],
  subAccounts: ["All"],
  costCategories: ["All"],
  apps: ["All"],
  teams: ["All"],
  envs: ["All"],
  currencyModes: ["usd"],
  tagKeys: [],
};

export const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
