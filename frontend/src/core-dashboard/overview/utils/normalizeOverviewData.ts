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
    trend7dDeltaPercent: 0,
    trend30dDeltaPercent: 0,
    openAlertRiskCount: 0,
    highRiskAlertCount: 0,
    trustScore: 0,
    potentialSavings30d: 0,
    realizedSavingsMtd: 0,
    pipelineSavings: 0,
    presentation: {
      mtdSpend: { comparison: "vs prior 0.0%", comparisonValue: 0, status: "On track" },
      eomForecast: { comparison: "vs budget 0.0%", comparisonValue: 0, status: "On track" },
      budgetVariance: { comparison: "variance 0.0%", comparisonValue: 0, status: "On track" },
      costTrend: { comparison: "30d 0.0%", comparisonValue: 0, status: "On track" },
      openAlertRisk: { comparison: "0 high", comparisonValue: 0, status: "On track" },
      trustScore: { comparison: "Low confidence", comparisonValue: 0, status: "Watch" },
      potentialSavings: { comparison: "0 actions", comparisonValue: 0, status: "Watch" },
      realizedSavings: {
        comparison: "Pipeline unavailable",
        comparisonValue: 0,
        status: "Watch",
        coveragePercent: 0,
      },
    },
    ownerLinks: {
      mtdSpend: "/dashboard/forecasting-budgets",
      eomForecast: "/dashboard/forecasting-budgets",
      costTrend: "/dashboard/cost-drivers",
      openAlertRisk: "/dashboard/alerts-incidents",
      trustScore: "/dashboard/data-quality",
      potentialSavings: "/dashboard/optimization",
    },
    calculationContext: {
      asOfDate: null,
      monthStartDate: null,
      monthEndDate: null,
      daysElapsed: 0,
      daysInMonth: 0,
      daysRemaining: 0,
      runRatePerDay: 0,
      budgetSource: "Auto baseline",
      realizedSavingsMethod: "Sum(max(ListCost - EffectiveCost, 0)) within current month window",
    },
  },
  outcomeAndRisk: {
    budgetBurn: {
      status: "Watch",
      budgetConsumedPercent: 0,
      monthElapsedPercent: 0,
      varianceToPacePercent: 0,
      burnRatePerDay: 0,
      breachEtaDays: null,
      breachEtaDate: null,
      breachEtaLabel: null,
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
    alertsLink: "/dashboard/alerts-incidents",
    spendAnalyticsLink: "/dashboard/cost-analysis",
  },
  dataTrust: {
    lastDataRefreshAt: null,
    freshnessHours: null,
    providerCoveragePercent: 0,
    costCoveragePercent: 0,
    allocationPercent: 0,
    confidenceLevel: "Low",
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
      presentation: {
        ...emptyExecutiveOverview.kpiHeader.presentation,
        ...(source.kpiHeader?.presentation ?? {}),
      },
      ownerLinks: {
        ...emptyExecutiveOverview.kpiHeader.ownerLinks,
        ...(source.kpiHeader?.ownerLinks ?? {}),
      },
      calculationContext: {
        ...emptyExecutiveOverview.kpiHeader.calculationContext,
        ...(source.kpiHeader?.calculationContext ?? {}),
      },
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

