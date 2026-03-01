export type OverviewStatusType = "loading" | "noUpload" | "empty";

export interface OverviewFilters {
  provider: string;
  service: string;
  region: string;
}

export type OverviewFilterPatch = Partial<OverviewFilters>;

export interface OverviewFilterOptions {
  providers: string[];
  services: string[];
  regions: string[];
}

export interface NameValueMetric {
  name: string;
  value: number;
}

export interface DailySpendPoint {
  date: string;
  cost: number;
}

export interface BillingPeriod {
  start: string | null;
  end: string | null;
}

export type RiskSeverity = "low" | "medium" | "high";

export interface OverviewRiskFlag {
  key: string;
  label: string;
  active: boolean;
  severity: RiskSeverity;
  count: number | null;
  impactValue: number;
  metricPercent?: number | null;
  metricHours?: number | null;
  ctaLink?: string;
}

export interface BudgetBurn {
  status: string;
  budgetConsumedPercent: number;
  monthElapsedPercent: number;
  varianceToPacePercent: number;
  burnRatePerDay: number;
  breachEtaDays?: number | null;
  breachEtaDate?: string | null;
  breachEtaLabel?: string | null;
}

export interface TopMoverDriver {
  name: string;
  deltaValue: number;
  direction: string;
  reasonLabel?: string;
  confidence?: string;
  deepLink?: string;
}

export interface ProviderMixEntry {
  provider: string;
  value: number;
  percent: number;
}

export interface OverviewAction {
  id: string;
  title: string;
  owner: string;
  status: string;
  expectedSavings: number;
  confidence: string;
  etaDays?: number;
  etaLabel?: string;
  deepLink?: string;
}

export interface OverviewAnomaly {
  id: string | number | null;
  serviceName: string;
  providerName: string;
  regionName: string;
  impactPerDay: number;
  impactToDate?: number;
  suspectedCause: string;
  firstDetectedDate: string | null;
  cost?: number;
  title?: string;
  severity?: string;
  timeWindowLabel?: string;
  deepLink?: string;
}

export interface ExecutiveKpiPresentationItem {
  comparison: string;
  comparisonValue: number;
  status: string;
  coveragePercent?: number;
}

export interface ExecutiveOverview {
  kpiHeader: {
    mtdSpend: number;
    mtdSpendDeltaPercent: number;
    eomForecast: number;
    budget: number;
    budgetVarianceValue: number;
    budgetVariancePercent: number;
    trend7dDeltaPercent: number;
    trend30dDeltaPercent: number;
    openAlertRiskCount: number;
    highRiskAlertCount: number;
    trustScore: number;
    potentialSavings30d: number;
    realizedSavingsMtd: number;
    pipelineSavings: number;
    presentation?: {
      mtdSpend: ExecutiveKpiPresentationItem;
      eomForecast: ExecutiveKpiPresentationItem;
      budgetVariance: ExecutiveKpiPresentationItem;
      costTrend: ExecutiveKpiPresentationItem;
      openAlertRisk: ExecutiveKpiPresentationItem;
      trustScore: ExecutiveKpiPresentationItem;
      potentialSavings: ExecutiveKpiPresentationItem;
      realizedSavings: ExecutiveKpiPresentationItem;
    };
    ownerLinks?: {
      mtdSpend: string;
      eomForecast: string;
      costTrend: string;
      openAlertRisk: string;
      trustScore: string;
      potentialSavings: string;
    };
    calculationContext?: {
      asOfDate: string | null;
      monthStartDate: string | null;
      monthEndDate: string | null;
      daysElapsed: number;
      daysInMonth: number;
      daysRemaining: number;
      runRatePerDay: number;
      budgetSource: string;
      realizedSavingsMethod?: string;
    };
  };
  outcomeAndRisk: {
    budgetBurn: BudgetBurn;
    riskFlags: OverviewRiskFlag[];
  };
  topMovers: {
    drivers: TopMoverDriver[];
    providerMix: ProviderMixEntry[];
    concentration: {
      topRegion: { name: string; sharePercent: number };
      topService: { name: string; sharePercent: number };
    };
    spendAnalyticsLink: string;
    driversLink: string;
  };
  actionCenter: {
    actions: OverviewAction[];
    optimizationLink: string;
  };
  anomalySpotlight: {
    anomalies: OverviewAnomaly[];
    alertsLink?: string;
    spendAnalyticsLink: string;
  };
  dataTrust: {
    lastDataRefreshAt: string | null;
    freshnessHours: number | null;
    providerCoveragePercent?: number;
    costCoveragePercent?: number;
    allocationPercent?: number;
    confidenceLevel?: "High" | "Medium" | "Low";
    ownerCoveragePercent: number;
    ownerCoverageValue: number;
    tagCompliancePercent: number;
    tagComplianceHeadline: string;
    governanceLink: string;
  };
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? U[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export interface OverviewApiData {
  message?: string;
  totalSpend?: number;
  dailyData?: DailySpendPoint[];
  groupedData?: NameValueMetric[];
  allRegionData?: NameValueMetric[];
  topRegion?: Partial<NameValueMetric>;
  topService?: Partial<NameValueMetric>;
  topProvider?: Partial<NameValueMetric>;
  spendChangePercent?: number;
  avgDailySpend?: number;
  billingPeriod?: BillingPeriod | null;
  untaggedCost?: number;
  missingMetadataCost?: number;
  topRegionPercent?: number;
  topServicePercent?: number;
  executiveOverview?: DeepPartial<ExecutiveOverview>;
}

export interface OverviewNormalizedData {
  totalSpend: number;
  trendPercentage: number;
  avgDailySpend: number;
  billingPeriod: BillingPeriod | null;
  dailyData: DailySpendPoint[];
  groupedData: NameValueMetric[];
  allRegionData: NameValueMetric[];
  topRegion: NameValueMetric;
  topService: NameValueMetric;
  topProvider: NameValueMetric;
  spendChangePercent: number;
  untaggedCost: number;
  missingMetadataCost: number;
  topRegionPercent: number;
  topServicePercent: number;
  executiveOverview: ExecutiveOverview;
}

export interface OverviewCaps {
  modules?: {
    overview?: {
      enabled?: boolean;
      endpoints?: {
        overview?: unknown;
        filters?: unknown;
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

export interface OverviewApiClient {
  call: (
    moduleKey: string,
    endpointKey: string,
    options?: ApiCallOptions
  ) => Promise<unknown>;
}

export const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

