import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type {
  BreakdownRow,
  SpendAnalyticsFilterPatch,
  SpendAnalyticsFilters,
  SpendAnalyticsPayload,
} from "../types";
import type {
  BreakdownTabKey,
  BusinessInsightItem,
  KpiInsightDefinition,
  KpiInsightKey,
} from "../components/sections/types";
import {
  BREAKDOWN_FILTER_MAP,
  BREAKDOWN_TABS,
  DEFAULT_CONTROL_OPTIONS,
  DEFAULT_FILTER_VALUES,
  PALETTE,
} from "../utils/view.constants";
import {
  formatControlLabel,
  formatPercent,
  formatSignedPercent,
  getPointNumeric,
  getPointString,
  normalizeOptions,
} from "../utils/view.helpers";
import { formatCurrency, formatDate } from "../utils/format";

interface UseCostAnalysisViewModelArgs {
  filters: SpendAnalyticsFilters;
  onFiltersChange: (patch: SpendAnalyticsFilterPatch) => void;
  onResetFilters: () => void;
  spendAnalytics: SpendAnalyticsPayload | null;
}

export interface CostAnalysisViewModel {
  palette: string[];
  selectedFilterCount: number;
  showMediumFilters: boolean;
  showAdvancedFilters: boolean;
  setShowMediumFilters: (next: boolean | ((value: boolean) => boolean)) => void;
  setShowAdvancedFilters: (next: boolean | ((value: boolean) => boolean)) => void;
  resetAllFilters: () => void;
  controlOptions: {
    timeRangeOptions: string[];
    granularityOptions: string[];
    compareOptions: string[];
    costBasisOptions: string[];
    groupByOptions: string[];
  };
  scopeContext: {
    periodLabel: string;
    granularityLabel: string;
    compareLabel: string;
    costBasisLabel: string;
    groupByLabel: string;
  };
  kpiInsights: KpiInsightDefinition[];
  activeKpiInsight?: KpiInsightDefinition;
  toggleKpiInsight: (key: KpiInsightKey) => void;
  closeKpiInsight: () => void;
  businessInsights: BusinessInsightItem[];
  providerBreakdown: BreakdownRow[];
  regionBreakdown: BreakdownRow[];
  topServiceMix: BreakdownRow[];
  top5ServiceShare: number;
  topRegion?: BreakdownRow;
  compareLabel: string;
  trendSeries: Array<Record<string, string | number | boolean | undefined>>;
  normalizedChart: {
    rows: Array<Record<string, number | string | boolean>>;
    series: Array<{ label: string; safeKey: string; color: string }>;
  };
  legendSeriesKeys: string[];
  hiddenSeries: Set<string>;
  toggleSeries: (key: string) => void;
  breakdownRows: BreakdownRow[];
  breakdownTab: BreakdownTabKey;
  setBreakdownTab: (tab: BreakdownTabKey) => void;
  activeBreakdownTabLabel: string;
  activeBreakdownFilterValue: string;
  breakdownListRef: RefObject<HTMLDivElement | null>;
  resetBreakdownFilters: () => void;
  applyBreakdownFilter: (row: BreakdownRow) => void;
  anomalyHighlights: SpendAnalyticsPayload["anomalyDetection"]["list"];
  riskRows: SpendAnalyticsPayload["predictabilityRisk"]["riskMatrix"];
  forecast: SpendAnalyticsPayload["predictabilityRisk"]["forecast"] | null | undefined;
}

export const useCostAnalysisViewModel = ({
  filters,
  onFiltersChange,
  onResetFilters,
  spendAnalytics,
}: UseCostAnalysisViewModelArgs): CostAnalysisViewModel => {
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTabKey>("byService");
  const [showMediumFilters, setShowMediumFilters] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [selectedKpiKey, setSelectedKpiKey] = useState<KpiInsightKey | null>(null);
  const breakdownListRef = useRef<HTMLDivElement | null>(null);

  const trendSeries = spendAnalytics?.trend?.series ?? [];
  const activeKeys = spendAnalytics?.trend?.activeKeys ?? [];
  const compareLabel = spendAnalytics?.trend?.compareLabel || "Previous period";
  const kpiDeck = spendAnalytics?.kpiDeck;
  const breakdownRows = spendAnalytics?.breakdown?.[breakdownTab] ?? [];
  const anomalyList = spendAnalytics?.anomalyDetection?.list ?? [];
  const anomalyHighlights = useMemo(() => {
    const highlights = spendAnalytics?.anomalyDetection?.highlights;
    if (Array.isArray(highlights) && highlights.length > 0) return highlights;
    return [...anomalyList].sort((a, b) => b.impact - a.impact).slice(0, 3);
  }, [spendAnalytics?.anomalyDetection?.highlights, anomalyList]);
  const riskRows = spendAnalytics?.predictabilityRisk?.riskMatrix ?? [];
  const forecast = spendAnalytics?.predictabilityRisk?.forecast;
  const controlOptions = spendAnalytics?.controls?.options;
  const providerBreakdown = spendAnalytics?.breakdown?.byProvider ?? [];
  const regionBreakdown = spendAnalytics?.breakdown?.byRegion ?? [];
  const serviceBreakdown = spendAnalytics?.breakdown?.byService ?? [];
  const topServiceMix = serviceBreakdown.slice(0, 5);

  const totalSpendValue = kpiDeck?.totalSpend ?? 0;
  const avgDailySpendValue = kpiDeck?.avgDailySpend ?? 0;
  const peakDailySpendValue = kpiDeck?.peakDailySpend ?? 0;
  const trendPercentValue = kpiDeck?.trendPercent ?? 0;
  const volatilityScoreValue = kpiDeck?.volatilityScore ?? 0;
  const topConcentrationValue = kpiDeck?.topConcentrationShare ?? 0;
  const anomalyImpactValue = kpiDeck?.anomalyImpact ?? 0;
  const predictabilityScoreValue = kpiDeck?.predictabilityScore ?? 0;
  const projectedSpendValue = forecast?.projectedSpend ?? 0;
  const forecastDeltaValue = projectedSpendValue - totalSpendValue;
  const anomalyShareValue = totalSpendValue > 0 ? (anomalyImpactValue / totalSpendValue) * 100 : 0;
  const topProvider = providerBreakdown[0];
  const secondProvider = providerBreakdown[1];
  const topRegion = regionBreakdown[0];
  const secondRegion = regionBreakdown[1];
  const top5ServiceShare = topServiceMix.reduce((acc, item) => acc + item.sharePercent, 0);
  const highRiskCount = riskRows.filter((row) => row.riskLevel === "High").length;
  const mediumRiskCount = riskRows.filter((row) => row.riskLevel === "Medium").length;
  const activeProviderCount = providerBreakdown.filter((row) => row.spend > 0).length;
  const activeServiceCount = serviceBreakdown.filter((row) => row.spend > 0).length;
  const providerLeadShareGap =
    topProvider && secondProvider ? Math.max(0, topProvider.sharePercent - secondProvider.sharePercent) : 0;
  const regionLeadShareGap =
    topRegion && secondRegion ? Math.max(0, topRegion.sharePercent - secondRegion.sharePercent) : 0;
  const forecastRunupPercent = totalSpendValue > 0 ? (forecastDeltaValue / totalSpendValue) * 100 : 0;

  const periodStart = spendAnalytics?.controls?.startDate ?? trendSeries[0]?.date ?? "";
  const periodEnd =
    spendAnalytics?.controls?.endDate ?? trendSeries[Math.max(0, trendSeries.length - 1)]?.date ?? "";
  const periodLabel =
    periodStart && periodEnd ? `${formatDate(periodStart)} - ${formatDate(periodEnd)}` : "Selected period";
  const scopeContext = {
    periodLabel,
    granularityLabel: formatControlLabel(String(spendAnalytics?.controls?.granularity || "daily")),
    compareLabel: formatControlLabel(compareLabel),
    costBasisLabel: formatControlLabel(String(spendAnalytics?.controls?.costBasis || "actual")),
    groupByLabel: formatControlLabel(String(spendAnalytics?.controls?.groupBy || "ServiceName")),
  };

  const volatilityBand = volatilityScoreValue >= 25 ? "High" : volatilityScoreValue >= 12 ? "Medium" : "Low";
  const predictabilityBand =
    predictabilityScoreValue >= 75 ? "Strong" : predictabilityScoreValue >= 45 ? "Moderate" : "Weak";

  const kpiInsights = useMemo<KpiInsightDefinition[]>(
    () => [
      {
        key: "totalSpend",
        label: "Total Spend",
        value: formatCurrency(totalSpendValue),
        hint: "Spend in current selection",
        tone: trendPercentValue > 8 ? "warning" : "neutral",
        status: trendPercentValue > 8 ? "Watch" : "On track",
        meaning: "Total cloud spend captured in the selected filter scope.",
        quickNotes: [
          `Period: ${periodLabel}`,
          `Movement: ${formatSignedPercent(trendPercentValue)} vs comparison`,
          `Leading provider: ${topProvider?.name || "N/A"}`,
        ],
      },
      {
        key: "avgDailySpend",
        label: "Avg Daily Spend",
        value: formatCurrency(avgDailySpendValue),
        suffix: "/day",
        hint: "Run-rate baseline",
        tone: peakDailySpendValue > avgDailySpendValue * 1.8 ? "warning" : "positive",
        status: peakDailySpendValue > avgDailySpendValue * 1.8 ? "Spiky" : "Stable",
        meaning: "Daily average spend for this scope across the selected dates.",
        quickNotes: [
          `Peak day currently at ${formatCurrency(peakDailySpendValue)}`,
          `Forecast confidence: ${forecast?.confidence || "Low"}`,
          "Use this as your daily budget guardrail.",
        ],
      },
      {
        key: "peakDailySpend",
        label: "Peak Daily Spend",
        value: formatCurrency(peakDailySpendValue),
        hint: "Highest single-day spend",
        tone: peakDailySpendValue > avgDailySpendValue * 1.8 ? "critical" : "warning",
        status: peakDailySpendValue > avgDailySpendValue * 1.8 ? "Critical spike" : "Normal spike",
        meaning: "The highest day of spend inside the selected period.",
        quickNotes: [
          `Delta vs avg day: ${formatCurrency(Math.max(0, peakDailySpendValue - avgDailySpendValue))}`,
          `Anomaly impact currently ${formatCurrency(anomalyImpactValue)}`,
          "Check trend markers around this peak day for root cause.",
        ],
      },
      {
        key: "trendPercent",
        label: "Trend vs Compare",
        value: formatPercent(trendPercentValue),
        hint: "Period over period",
        tone: trendPercentValue > 0 ? "warning" : "positive",
        status: trendPercentValue > 0 ? "Increasing spend" : "Optimizing",
        meaning: "Change in spend relative to the selected comparison window.",
        quickNotes: [
          trendPercentValue > 0
            ? "Trend is rising and may pressure month-end budget."
            : "Trend is softening, indicating better cost control.",
          `Top 5 services hold ${formatPercent(top5ServiceShare)} of spend`,
          "Prioritize top contributors before deep optimization.",
        ],
      },
      {
        key: "volatilityScore",
        label: "Volatility Score",
        value: formatPercent(volatilityScoreValue),
        hint: "Spend stability signal",
        tone: volatilityBand === "High" ? "critical" : volatilityBand === "Medium" ? "warning" : "positive",
        status: `${volatilityBand} volatility`,
        meaning: "How much daily spend fluctuates during the selected period.",
        quickNotes: [
          `Predictability score is ${formatPercent(predictabilityScoreValue)}`,
          `Forecast confidence: ${forecast?.confidence || "Low"}`,
          "Lower volatility usually means better planning confidence.",
        ],
      },
      {
        key: "topConcentrationShare",
        label: "Top Concentration",
        value: formatPercent(topConcentrationValue),
        hint: "Dependence on largest cost slice",
        tone: topConcentrationValue >= 60 ? "critical" : topConcentrationValue >= 40 ? "warning" : "positive",
        status: topConcentrationValue >= 60 ? "Concentration risk" : "Diversified",
        meaning: "Share held by your largest spend contributor in this scope.",
        quickNotes: [
          `Top region: ${topRegion?.name || "N/A"} (${formatPercent(topRegion?.sharePercent ?? 0)})`,
          secondRegion
            ? `Second region: ${secondRegion.name} (${formatPercent(secondRegion.sharePercent)})`
            : "Only one region in scope",
          "Focus optimization across top 5 contributors, not only top 1.",
        ],
      },
      {
        key: "anomalyImpact",
        label: "Anomaly Impact",
        value: formatCurrency(anomalyImpactValue),
        hint: `${anomalyList.length} anomalies in scope`,
        tone: anomalyImpactValue > 0 ? "warning" : "positive",
        status: anomalyImpactValue > 0 ? "Active" : "Clear",
        meaning: "Potential spend impact from detected unusual behavior.",
        quickNotes: [
          `${formatPercent(anomalyShareValue)} of spend is anomaly-linked`,
          `Detected anomaly count: ${anomalyList.length}`,
          "Use anomaly list to separate expected spikes from leakages.",
        ],
      },
      {
        key: "predictabilityScore",
        label: "Predictability Score",
        value: formatPercent(predictabilityScoreValue),
        hint: "Confidence in spend planning",
        tone:
          predictabilityBand === "Strong" ? "positive" : predictabilityBand === "Moderate" ? "warning" : "critical",
        status: `${predictabilityBand} predictability`,
        meaning: "How reliably next spend values can be planned from current behavior.",
        quickNotes: [
          `Forecast: ${formatCurrency(projectedSpendValue)}`,
          `Forecast delta vs current: ${forecastDeltaValue >= 0 ? "+" : ""}${formatCurrency(forecastDeltaValue)}`,
          "Improve by reducing spikes and concentration exposure.",
        ],
      },
    ],
    [
      totalSpendValue,
      periodLabel,
      trendPercentValue,
      topProvider?.name,
      avgDailySpendValue,
      peakDailySpendValue,
      forecast?.confidence,
      anomalyImpactValue,
      top5ServiceShare,
      volatilityBand,
      volatilityScoreValue,
      predictabilityScoreValue,
      topConcentrationValue,
      topRegion?.name,
      topRegion?.sharePercent,
      secondRegion?.name,
      secondRegion?.sharePercent,
      anomalyList.length,
      anomalyShareValue,
      predictabilityBand,
      projectedSpendValue,
      forecastDeltaValue,
    ]
  );

  const activeKpiInsight = useMemo(
    () => (selectedKpiKey ? kpiInsights.find((kpi) => kpi.key === selectedKpiKey) : undefined),
    [kpiInsights, selectedKpiKey]
  );

  const businessInsights = useMemo<BusinessInsightItem[]>(
    () => [
      {
        label: "Forecast Runway",
        headline: `${forecastDeltaValue >= 0 ? "+" : ""}${formatCurrency(forecastDeltaValue)} vs current`,
        detail: `${formatSignedPercent(forecastRunupPercent)} implied run-up for selected scope`,
        tone: forecastDeltaValue > 0 ? "warning" : "positive",
      },
      {
        label: "Top-5 Service Dependency",
        headline: `${formatPercent(top5ServiceShare)} in top 5 services`,
        detail:
          topServiceMix.length >= 2
            ? `${topServiceMix[0]?.name || "N/A"} + ${topServiceMix[1]?.name || "N/A"} are primary drivers`
            : "Insufficient service spread data",
        tone: top5ServiceShare >= 75 ? "critical" : top5ServiceShare >= 55 ? "warning" : "positive",
      },
      {
        label: "Provider Lead Gap",
        headline: `${formatPercent(providerLeadShareGap)} lead spread`,
        detail:
          topProvider && secondProvider
            ? `${topProvider.name} (${formatPercent(topProvider.sharePercent)}) vs ${secondProvider.name} (${formatPercent(secondProvider.sharePercent)})`
            : "Not enough provider data for gap analysis",
        tone: providerLeadShareGap >= 25 ? "warning" : "neutral",
      },
      {
        label: "Region Lead Gap",
        headline: `${formatPercent(regionLeadShareGap)} lead spread`,
        detail:
          topRegion && secondRegion
            ? `${topRegion.name} (${formatPercent(topRegion.sharePercent)}) vs ${secondRegion.name} (${formatPercent(secondRegion.sharePercent)})`
            : "Not enough region data for gap analysis",
        tone: regionLeadShareGap >= 25 ? "warning" : "neutral",
      },
      {
        label: "Risk Hotspots",
        headline: `${highRiskCount} high-risk dimensions`,
        detail: `${mediumRiskCount} medium-risk dimensions in current risk matrix`,
        tone: highRiskCount > 0 ? "critical" : mediumRiskCount > 0 ? "warning" : "positive",
      },
      {
        label: "Spend Breadth",
        headline: `${activeProviderCount} providers | ${activeServiceCount} services`,
        detail: "Higher breadth reduces single-provider or single-service dependence",
        tone: activeProviderCount <= 1 || activeServiceCount <= 3 ? "warning" : "positive",
      },
    ],
    [
      forecastDeltaValue,
      forecastRunupPercent,
      top5ServiceShare,
      topServiceMix,
      providerLeadShareGap,
      topProvider,
      secondProvider,
      regionLeadShareGap,
      topRegion,
      secondRegion,
      highRiskCount,
      mediumRiskCount,
      activeProviderCount,
      activeServiceCount,
    ]
  );

  const timeRangeOptions = useMemo(
    () => normalizeOptions(controlOptions?.timeRanges ?? [], DEFAULT_CONTROL_OPTIONS.timeRanges),
    [controlOptions?.timeRanges]
  );
  const granularityOptions = useMemo(
    () => normalizeOptions(controlOptions?.granularities ?? [], DEFAULT_CONTROL_OPTIONS.granularities),
    [controlOptions?.granularities]
  );
  const compareOptions = useMemo(
    () => normalizeOptions(controlOptions?.compareTo ?? [], DEFAULT_CONTROL_OPTIONS.compareTo),
    [controlOptions?.compareTo]
  );
  const costBasisOptions = useMemo(
    () => normalizeOptions(controlOptions?.costBasis ?? [], DEFAULT_CONTROL_OPTIONS.costBasis),
    [controlOptions?.costBasis]
  );
  const groupByOptions = useMemo(
    () => normalizeOptions(controlOptions?.groupBy ?? [], DEFAULT_CONTROL_OPTIONS.groupBy),
    [controlOptions?.groupBy]
  );

  const selectedFilterCount = useMemo(() => {
    let count = 0;
    (Object.keys(DEFAULT_FILTER_VALUES) as Array<keyof typeof DEFAULT_FILTER_VALUES>).forEach((key) => {
      if (filters[key] !== DEFAULT_FILTER_VALUES[key]) count += 1;
    });
    return count;
  }, [filters]);

  const visibleSeriesKeys = useMemo(() => {
    const dataKeys = activeKeys.filter((key) => trendSeries.some((point) => getPointNumeric(point, key) > 0));
    const scopedKeys = dataKeys.slice(0, 8);
    const filtered = scopedKeys.filter((key) => !hiddenSeries.has(key));
    return filtered.length > 0 ? filtered : scopedKeys;
  }, [activeKeys, trendSeries, hiddenSeries]);

  const legendSeriesKeys = useMemo(
    () => activeKeys.filter((key) => trendSeries.some((point) => getPointNumeric(point, key) > 0)).slice(0, 8),
    [activeKeys, trendSeries]
  );

  const normalizedChart = useMemo(() => {
    const series = visibleSeriesKeys.map((label, index) => ({
      label,
      safeKey: `series_${index}`,
      color: PALETTE[index % PALETTE.length],
    }));

    const rows = trendSeries.map((point, index) => {
      const row: Record<string, number | string | boolean> = {
        idx: index + 1,
        date: getPointString(point, "date"),
        dateLabel: getPointString(point, "date"),
        total: getPointNumeric(point, "total"),
        previousTotal: getPointNumeric(point, "previousTotal"),
        isAnomaly: Boolean((point as Record<string, unknown>)?.isAnomaly),
      };
      series.forEach((item) => {
        row[item.safeKey] = getPointNumeric(point, item.label);
      });
      return row;
    });

    return { rows, series };
  }, [trendSeries, visibleSeriesKeys]);

  const applyBreakdownFilter = (row: BreakdownRow): void => {
    const key = BREAKDOWN_FILTER_MAP[breakdownTab];
    onFiltersChange({ [key]: row.name } as SpendAnalyticsFilterPatch);
  };

  const resetBreakdownFilters = (): void => {
    onFiltersChange({
      provider: "All",
      service: "All",
      region: "All",
      account: "All",
      team: "All",
      app: "All",
      env: "All",
      costCategory: "All",
    });
  };

  const activeBreakdownFilterField = BREAKDOWN_FILTER_MAP[breakdownTab];
  const activeBreakdownFilterValue = String(filters[activeBreakdownFilterField] || "All");
  const activeBreakdownTabLabel =
    BREAKDOWN_TABS.find((tab) => tab.key === breakdownTab)?.label ?? "Service";

  const resetAllFilters = (): void => {
    setHiddenSeries(new Set());
    setShowAdvancedFilters(false);
    setShowMediumFilters(false);
    onResetFilters();
  };

  const toggleSeries = (key: string): void => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleKpiInsight = (key: KpiInsightKey): void => {
    setSelectedKpiKey((prev) => (prev === key ? null : key));
  };

  const closeKpiInsight = (): void => {
    setSelectedKpiKey(null);
  };

  useEffect(() => {
    if (breakdownListRef.current) {
      breakdownListRef.current.scrollTop = 0;
    }
  }, [breakdownTab, activeBreakdownFilterValue]);

  return {
    palette: PALETTE,
    selectedFilterCount,
    showMediumFilters,
    showAdvancedFilters,
    setShowMediumFilters,
    setShowAdvancedFilters,
    resetAllFilters,
    controlOptions: {
      timeRangeOptions,
      granularityOptions,
      compareOptions,
      costBasisOptions,
      groupByOptions,
    },
    scopeContext,
    kpiInsights,
    activeKpiInsight,
    toggleKpiInsight,
    closeKpiInsight,
    businessInsights,
    providerBreakdown,
    regionBreakdown,
    topServiceMix,
    top5ServiceShare,
    topRegion,
    compareLabel,
    trendSeries,
    normalizedChart,
    legendSeriesKeys,
    hiddenSeries,
    toggleSeries,
    breakdownRows,
    breakdownTab,
    setBreakdownTab,
    activeBreakdownTabLabel,
    activeBreakdownFilterValue,
    breakdownListRef,
    resetBreakdownFilters,
    applyBreakdownFilter,
    anomalyHighlights,
    riskRows,
    forecast,
  };
};
