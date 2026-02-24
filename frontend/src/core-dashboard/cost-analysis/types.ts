export type CostBasis = "actual" | "amortized" | "net";
export type TimeRangePreset = "7d" | "30d" | "90d" | "mtd" | "qtd" | "custom";
export type Granularity = "daily" | "weekly" | "monthly";
export type CompareTo = "previous_period" | "same_period_last_month" | "none";
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

export interface SpendAnalyticsPayload {
  controls: {
    timeRange: TimeRangePreset | string;
    granularity: Granularity | string;
    compareTo: CompareTo | string;
    costBasis: CostBasis | string;
    groupBy: SpendAnalyticsGroupBy | string;
    startDate: string | null;
    endDate: string | null;
    options: {
      timeRanges: TimeRangePreset[] | string[];
      granularities: Granularity[] | string[];
      compareTo: CompareTo[] | string[];
      costBasis: CostBasis[] | string[];
      groupBy: SpendAnalyticsGroupBy[] | string[];
    };
  };
  kpiDeck: {
    totalSpend: number;
    avgDailySpend: number;
    peakDailySpend: number;
    trendPercent: number;
    volatilityScore: number;
    topConcentrationShare: number;
    anomalyImpact: number;
    predictabilityScore: number;
  };
  trend: {
    granularity: Granularity | string;
    compareLabel: string;
    activeKeys: string[];
    series: TrendSeriesPoint[];
  };
  breakdown: {
    byProvider: BreakdownRow[];
    byService: BreakdownRow[];
    byRegion: BreakdownRow[];
    byAccount: BreakdownRow[];
    byTeam: BreakdownRow[];
    byApp: BreakdownRow[];
    byEnv: BreakdownRow[];
    byCostCategory: BreakdownRow[];
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
  predictabilityRisk: {
    forecast: {
      projectedSpend: number;
      lowerBound: number;
      upperBound: number;
      confidence: string;
      points: Array<{ date: string; forecast: number; lower: number; upper: number }>;
    };
    predictabilityScore: number;
    volatilityScore: number;
    riskMatrix: Array<{
      name: string;
      spend: number;
      spendShare: number;
      volatility: number;
      riskLevel: string;
    }>;
  };
  concentrationPareto: {
    top10ServicesShare: number;
    top3AccountsShare: number;
    singleRegionShare: number;
    topServices: Array<{ name: string; value: number }>;
    topAccounts: Array<{ name: string; value: number }>;
    topRegions: Array<{ name: string; value: number }>;
  };
  drilldownPaths: {
    varianceDrivers: string;
    resourceInventory: string;
    billingExplorer: string;
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
  tagKeys: [],
};

export const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
