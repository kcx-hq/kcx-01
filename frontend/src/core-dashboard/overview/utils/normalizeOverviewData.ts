import {
  ExecutiveOverview,
  NameValueMetric,
  OverviewApiData,
  OverviewNormalizedData,
} from "../types";

const emptyExecutiveOverview: ExecutiveOverview = {
  kpiHeader: {
    mtdSpend: 0,
    mtdSpendDeltaPercent: 0,
    eomForecast: 0,
    budget: 0,
    budgetVarianceValue: 0,
    budgetVariancePercent: 0,
    realizedSavingsMtd: 0,
    pipelineSavings: 0,
    unallocatedSpendValue: 0,
    unallocatedSpendPercent: 0,
  },
  outcomeAndRisk: {
    budgetBurn: {
      status: "Watch",
      budgetConsumedPercent: 0,
      monthElapsedPercent: 0,
      varianceToPacePercent: 0,
      burnRatePerDay: 0,
    },
    riskFlags: [],
  },
  topMovers: {
    drivers: [],
    providerMix: [],
    concentration: {
      topRegion: { name: "N/A", sharePercent: 0 },
      topService: { name: "N/A", sharePercent: 0 },
    },
    spendAnalyticsLink: "/dashboard/cost-analysis",
    driversLink: "/dashboard/cost-drivers",
  },
  actionCenter: {
    actions: [],
    optimizationLink: "/dashboard/optimization",
  },
  anomalySpotlight: {
    anomalies: [],
    spendAnalyticsLink: "/dashboard/cost-analysis",
  },
  dataTrust: {
    lastDataRefreshAt: null,
    freshnessHours: null,
    ownerCoveragePercent: 0,
    ownerCoverageValue: 0,
    tagCompliancePercent: 0,
    tagComplianceHeadline: "Tag compliance unavailable",
    governanceLink: "/dashboard/data-quality",
  },
};

const emptyMetric: NameValueMetric = { name: "N/A", value: 0 };

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeMetric = (value?: Partial<NameValueMetric>): NameValueMetric => ({
  name: value?.name ?? "N/A",
  value: toNumber(value?.value ?? 0),
});

const normalizeExecutiveOverview = (
  source: OverviewApiData["executiveOverview"]
): ExecutiveOverview => {
  if (!source) return emptyExecutiveOverview;

  return {
    ...emptyExecutiveOverview,
    ...source,
    kpiHeader: {
      ...emptyExecutiveOverview.kpiHeader,
      ...(source.kpiHeader ?? {}),
    },
    outcomeAndRisk: {
      ...emptyExecutiveOverview.outcomeAndRisk,
      ...(source.outcomeAndRisk ?? {}),
      budgetBurn: {
        ...emptyExecutiveOverview.outcomeAndRisk.budgetBurn,
        ...(source.outcomeAndRisk?.budgetBurn ?? {}),
      },
      riskFlags: Array.isArray(source.outcomeAndRisk?.riskFlags)
        ? source.outcomeAndRisk.riskFlags
        : [],
    },
    topMovers: {
      ...emptyExecutiveOverview.topMovers,
      ...(source.topMovers ?? {}),
      drivers: Array.isArray(source.topMovers?.drivers) ? source.topMovers.drivers : [],
      providerMix: Array.isArray(source.topMovers?.providerMix) ? source.topMovers.providerMix : [],
      concentration: {
        ...emptyExecutiveOverview.topMovers.concentration,
        ...(source.topMovers?.concentration ?? {}),
      },
    },
    actionCenter: {
      ...emptyExecutiveOverview.actionCenter,
      ...(source.actionCenter ?? {}),
      actions: Array.isArray(source.actionCenter?.actions) ? source.actionCenter.actions : [],
    },
    anomalySpotlight: {
      ...emptyExecutiveOverview.anomalySpotlight,
      ...(source.anomalySpotlight ?? {}),
      anomalies: Array.isArray(source.anomalySpotlight?.anomalies)
        ? source.anomalySpotlight.anomalies
        : [],
    },
    dataTrust: {
      ...emptyExecutiveOverview.dataTrust,
      ...(source.dataTrust ?? {}),
    },
  };
};

const emptyNormalizedData: OverviewNormalizedData = {
  totalSpend: 0,
  trendPercentage: 0,
  avgDailySpend: 0,
  billingPeriod: null,
  dailyData: [],
  groupedData: [],
  allRegionData: [],
  topRegion: emptyMetric,
  topService: emptyMetric,
  topProvider: emptyMetric,
  spendChangePercent: 0,
  untaggedCost: 0,
  missingMetadataCost: 0,
  topRegionPercent: 0,
  topServicePercent: 0,
  executiveOverview: emptyExecutiveOverview,
};

export function normalizeOverviewData(
  overviewData: OverviewApiData | null | undefined
): OverviewNormalizedData {
  if (!overviewData) return emptyNormalizedData;

  return {
    totalSpend: toNumber(overviewData.totalSpend),
    trendPercentage: 0,
    avgDailySpend: toNumber(overviewData.avgDailySpend),
    billingPeriod: overviewData.billingPeriod ?? null,
    dailyData: Array.isArray(overviewData.dailyData) ? overviewData.dailyData : [],
    groupedData: Array.isArray(overviewData.groupedData) ? overviewData.groupedData : [],
    allRegionData: Array.isArray(overviewData.allRegionData) ? overviewData.allRegionData : [],
    topRegion: normalizeMetric(overviewData.topRegion),
    topService: normalizeMetric(overviewData.topService),
    topProvider: normalizeMetric(overviewData.topProvider),
    spendChangePercent: toNumber(overviewData.spendChangePercent),
    untaggedCost: toNumber(overviewData.untaggedCost),
    missingMetadataCost: toNumber(overviewData.missingMetadataCost),
    topRegionPercent: toNumber(overviewData.topRegionPercent),
    topServicePercent: toNumber(overviewData.topServicePercent),
    executiveOverview: normalizeExecutiveOverview(overviewData.executiveOverview),
  };
}

