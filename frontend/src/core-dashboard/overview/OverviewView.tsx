import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterBar from "../common/widgets/FilterBar";
import KpiInsightModal from "../common/components/KpiInsightModal";
import { SectionLoading, SectionRefreshOverlay } from "../common/SectionStates";
import OverviewStates from "./components/OverviewStates";
import ExecutiveKpiStrip, {
  ExecutiveKpiCardModel,
  ExecutiveKpiInfoModel,
} from "./components/executive/ExecutiveKpiStrip";
import TopMoversPreview from "./components/executive/TopMoversPreview";
import TopActionsPreview from "./components/executive/TopActionsPreview";
import AnomalySpotlightPreview from "./components/executive/AnomalySpotlightPreview";
import TrustFooterStrip from "./components/executive/TrustFooterStrip";
import {
  OverviewApiData,
  OverviewFilterOptions,
  OverviewFilterPatch,
  OverviewFilters,
  OverviewNormalizedData,
} from "./types";
import { formatSignedPct, formatUSD, toSafeNumber } from "./components/executive/formatters";

interface OverviewViewProps {
  filters: OverviewFilters;
  filterOptions: OverviewFilterOptions;
  onFilterChange: (filters: OverviewFilterPatch) => void;
  onReset: () => void;
  loading: boolean;
  isFiltering: boolean;
  overviewData: OverviewApiData | null;
  extractedData: OverviewNormalizedData;
}

const formatDateLabel = (value?: string | null): string => {
  if (!value) return "N/A";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const roundToNumber = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(toSafeNumber(value) * factor) / factor;
};

const formatSignedUSD = (value: number): string => {
  const amount = toSafeNumber(value);
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${formatUSD(Math.abs(amount))}`;
};

const OverviewView = ({
  filters,
  filterOptions,
  onFilterChange,
  onReset,
  loading,
  isFiltering,
  overviewData,
  extractedData,
}: OverviewViewProps) => {
  const navigate = useNavigate();
  const executiveOverview = extractedData.executiveOverview;
  const kpis = executiveOverview.kpiHeader;
  const topMovers = executiveOverview.topMovers;
  const actionCenter = executiveOverview.actionCenter;
  const anomalySpotlight = executiveOverview.anomalySpotlight;
  const dataTrust = executiveOverview.dataTrust;

  const [activeKpiKey, setActiveKpiKey] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<ExecutiveKpiInfoModel | null>(null);

  const forecastDeltaValue = toSafeNumber(kpis.budgetVarianceValue);
  const providerCoveragePercent = toSafeNumber(dataTrust?.providerCoveragePercent);
  const costCoveragePercent = toSafeNumber(dataTrust?.costCoveragePercent);
  const allocatedPercent = toSafeNumber(dataTrust?.allocationPercent);
  const confidenceLevel = dataTrust?.confidenceLevel || "Low";
  const openAlertRiskCount = toSafeNumber(kpis.openAlertRiskCount);
  const highRiskAlertCount = toSafeNumber(kpis.highRiskAlertCount);
  const trustScore = toSafeNumber(kpis.trustScore);
  const potentialSavings30d = toSafeNumber(kpis.potentialSavings30d || kpis.pipelineSavings);
  const ownerLinks = kpis.ownerLinks || {
    mtdSpend: "/dashboard/forecasting-budgets",
    eomForecast: "/dashboard/forecasting-budgets",
    costTrend: "/dashboard/cost-drivers",
    openAlertRisk: "/dashboard/alerts-incidents",
    trustScore: "/dashboard/data-quality",
    potentialSavings: "/dashboard/optimization",
  };

  const mtdPresentation = kpis.presentation?.mtdSpend || {
    comparison: "vs prior +0.0%",
    comparisonValue: 0,
    status: "On track",
  };
  const forecastPresentation = kpis.presentation?.eomForecast || {
    comparison: "vs budget 0.0%",
    comparisonValue: 0,
    status: "On track",
  };
  const budgetVariancePresentation = kpis.presentation?.budgetVariance || {
    comparison: "variance 0.0%",
    comparisonValue: 0,
    status: "On track",
  };
  const alertPresentation = kpis.presentation?.openAlertRisk || {
    comparison: "0 high",
    comparisonValue: 0,
    status: "On track",
  };
  const trustPresentation = kpis.presentation?.trustScore || {
    comparison: "Low confidence",
    comparisonValue: 0,
    status: "Watch",
  };
  const potentialPresentation = kpis.presentation?.potentialSavings || {
    comparison: "0 actions",
    comparisonValue: 0,
    status: "Watch",
  };
  const realizedPresentation = kpis.presentation?.realizedSavings || {
    comparison: "Pipeline unavailable",
    comparisonValue: 0,
    status: "Watch",
    coveragePercent: 0,
  };

  const calcContext = kpis.calculationContext;
  const asOfDate = formatDateLabel(calcContext?.asOfDate || dataTrust?.lastDataRefreshAt || null);
  const monthStartDate = formatDateLabel(calcContext?.monthStartDate);
  const monthEndDate = formatDateLabel(calcContext?.monthEndDate);
  const daysRemaining = toSafeNumber(calcContext?.daysRemaining);
  const runRatePerDay = toSafeNumber(calcContext?.runRatePerDay);
  const realizedSavingsMethod =
    calcContext?.realizedSavingsMethod || "Sum(max(ListCost - EffectiveCost, 0)) within current month window";
  const pipelineSavingsValue = toSafeNumber(kpis.pipelineSavings || potentialSavings30d);
  const realizedCoveragePercent = toSafeNumber(realizedPresentation?.coveragePercent);
  const actions = (actionCenter?.actions || []).slice(0, 5);

  const kpiCards = useMemo<ExecutiveKpiCardModel[]>(
    () => [
      {
        key: "mtd-spend",
        label: "MTD Spend",
        value: formatUSD(kpis.mtdSpend),
        comparison: mtdPresentation.comparison,
        comparisonValue: toSafeNumber(mtdPresentation.comparisonValue ?? kpis.mtdSpendDeltaPercent),
        status: mtdPresentation.status,
        deepLink: ownerLinks.mtdSpend,
        metaTooltip: "Formula: sum of current-month spend for selected scope. Source: Forecasting & Budgets.",
        info: {
          title: "MTD Spend",
          value: formatUSD(kpis.mtdSpend),
          summary: "Current month spend for the selected scope.",
          contextLabel: `${monthStartDate} to ${asOfDate}`,
          badgeText: mtdPresentation.status,
          details: [
            `Formula: Sum of spend from month start to current as-of date`,
            `MTD spend: ${formatUSD(kpis.mtdSpend)}`,
            `Delta vs prior: ${formatSignedPct(kpis.mtdSpendDeltaPercent)}`,
            `Owner section: Forecasting & Budgets`,
          ],
        },
      },
      {
        key: "eom-forecast",
        label: "EOM Forecast",
        value: formatUSD(kpis.eomForecast),
        comparison: forecastPresentation.comparison,
        comparisonValue: toSafeNumber(forecastPresentation.comparisonValue),
        status: forecastPresentation.status,
        deepLink: ownerLinks.eomForecast,
        metaTooltip: "Formula: run-rate x days in month. Source: Forecasting & Budgets.",
        info: {
          title: "EOM Forecast vs Budget",
          value: formatUSD(kpis.eomForecast),
          summary: "Projected end-of-month spend using current MTD run-rate and remaining days.",
          contextLabel: `${asOfDate} to ${monthEndDate}`,
          badgeText: forecastPresentation.status,
          details: [
            `Forecast horizon: ${asOfDate} to ${monthEndDate}`,
            `Days remaining: ${daysRemaining}`,
            `Run-rate used: ${formatUSD(runRatePerDay)} per day`,
            `Budget gap: ${formatUSD(forecastDeltaValue)} (${forecastPresentation.comparison})`,
            `Owner section: Forecasting & Budgets`,
          ],
        },
      },
      {
        key: "budget-variance",
        label: "Budget Variance",
        value: formatSignedUSD(forecastDeltaValue),
        comparison: budgetVariancePresentation.comparison || `variance ${formatSignedPct(kpis.budgetVariancePercent)}`,
        comparisonValue: toSafeNumber(
          budgetVariancePresentation.comparisonValue ?? kpis.budgetVariancePercent
        ),
        status: budgetVariancePresentation.status,
        deepLink: ownerLinks.eomForecast,
        metaTooltip: "Formula: EOM forecast - budget baseline. Source: Forecasting & Budgets.",
        info: {
          title: "Budget Variance",
          value: formatSignedUSD(forecastDeltaValue),
          summary: "Difference between end-of-month forecast and budget baseline.",
          contextLabel: `As of ${asOfDate}`,
          badgeText: budgetVariancePresentation.status,
          details: [
            `Budget baseline: ${formatUSD(kpis.budget)}`,
            `EOM forecast: ${formatUSD(kpis.eomForecast)}`,
            `Variance value: ${formatSignedUSD(kpis.budgetVarianceValue)}`,
            `Variance percent: ${formatSignedPct(kpis.budgetVariancePercent)}`,
            `Budget status: ${
              toSafeNumber(kpis.budgetVarianceValue) > 0
                ? "Over budget"
                : toSafeNumber(kpis.budgetVarianceValue) < 0
                  ? "Under budget"
                  : "On budget"
            }`,
            `Owner section: Forecasting & Budgets`,
          ],
        },
      },
      {
        key: "open-alert-risk",
        label: "Open Alert Risk",
        value: `${openAlertRiskCount}`,
        comparison: alertPresentation.comparison || `${highRiskAlertCount} high`,
        comparisonValue: toSafeNumber(alertPresentation.comparisonValue || openAlertRiskCount),
        status: alertPresentation.status,
        deepLink: ownerLinks.openAlertRisk,
        metaTooltip: "Count of active risk flags for current scope.",
        info: {
          title: "Open Alert Risk Count",
          value: `${openAlertRiskCount}`,
          summary: "Total active risk alerts currently affecting this scope.",
          contextLabel: `As of ${asOfDate}`,
          badgeText: alertPresentation.status,
          details: [
            `Active risks: ${openAlertRiskCount}`,
            `High-severity risks: ${highRiskAlertCount}`,
            `Risk source: governance, freshness, anomalies, and concentration checks`,
            `Owner section: Alerts & Incidents`,
          ],
        },
      },
      {
        key: "trust-score",
        label: "Trust Score",
        value: `${trustScore.toFixed(1)}/100`,
        comparison: trustPresentation.comparison || `${confidenceLevel} confidence`,
        comparisonValue: roundToNumber(80 - trustScore),
        status: trustPresentation.status,
        deepLink: ownerLinks.trustScore,
        metaTooltip: "Weighted trust score from freshness, provider coverage, cost coverage, and allocation coverage.",
        info: {
          title: "Trust Score",
          value: `${trustScore.toFixed(1)}/100`,
          summary: "Confidence score for decision-quality data in current scope.",
          contextLabel: `As of ${asOfDate}`,
          badgeText: trustPresentation.status,
          details: [
            `Provider coverage: ${providerCoveragePercent.toFixed(1)}%`,
            `Cost coverage: ${costCoveragePercent.toFixed(1)}%`,
            `Allocation coverage: ${allocatedPercent.toFixed(1)}%`,
            `Confidence level: ${confidenceLevel}`,
            `Owner section: Governance & Data Quality`,
          ],
        },
      },
      {
        key: "potential-savings",
        label: "Potential Savings (30d)",
        value: formatUSD(potentialSavings30d),
        comparison: potentialPresentation.comparison || `${actions.length} actions`,
        comparisonValue: toSafeNumber(potentialPresentation.comparisonValue || potentialSavings30d),
        status: potentialPresentation.status,
        deepLink: ownerLinks.potentialSavings,
        metaTooltip: "Aggregated optimization savings pipeline for the next 30 days.",
        info: {
          title: "Potential Savings (30d)",
          value: formatUSD(potentialSavings30d),
          summary: "Estimated monthly optimization potential from current recommendation set.",
          contextLabel: `As of ${asOfDate}`,
          badgeText: potentialPresentation.status,
          details: [
            `Potential savings pipeline: ${formatUSD(pipelineSavingsValue)}`,
            `Realized MTD savings: ${formatUSD(kpis.realizedSavingsMtd)}`,
            pipelineSavingsValue > 0
              ? `Pipeline attainment: ${realizedCoveragePercent.toFixed(1)}%`
              : "Pipeline attainment: not available",
            `Method: ${realizedSavingsMethod}`,
            `Owner section: Optimization`,
          ],
        },
      },
    ],
    [
      asOfDate,
      trustScore,
      openAlertRiskCount,
      highRiskAlertCount,
      ownerLinks,
      actions.length,
      daysRemaining,
      forecastDeltaValue,
      kpis.budget,
      kpis.budgetVariancePercent,
      kpis.budgetVarianceValue,
      kpis.eomForecast,
      kpis.mtdSpend,
      kpis.pipelineSavings,
      kpis.potentialSavings30d,
      kpis.openAlertRiskCount,
      kpis.highRiskAlertCount,
      kpis.trustScore,
      kpis.ownerLinks,
      kpis.presentation,
      kpis.realizedSavingsMtd,
      monthEndDate,
      monthStartDate,
      pipelineSavingsValue,
      realizedCoveragePercent,
      realizedSavingsMethod,
      runRatePerDay,
      alertPresentation.comparison,
      alertPresentation.comparisonValue,
      alertPresentation.status,
      trustPresentation.comparison,
      trustPresentation.status,
      potentialPresentation.comparison,
      potentialPresentation.comparisonValue,
      potentialPresentation.status,
      budgetVariancePresentation.comparison,
      budgetVariancePresentation.comparisonValue,
      budgetVariancePresentation.status,
      mtdPresentation.comparison,
      mtdPresentation.comparisonValue,
      mtdPresentation.status,
      providerCoveragePercent,
      costCoveragePercent,
      allocatedPercent,
      confidenceLevel,
    ]
  );
  const movers = (topMovers?.drivers || []).slice(0, 5);
  const anomalies = (anomalySpotlight?.anomalies || []).slice(0, 3);

  if (overviewData?.message === "No upload selected. Please select a billing upload.") {
    return <OverviewStates type="noUpload" />;
  }

  if (loading && !overviewData) {
    return <SectionLoading label="Analyzing Overview..." />;
  }

  return (
    <div className="core-shell flex h-full flex-col animate-in fade-in duration-500">
      <div className="sticky top-0 z-30 -mx-2 mb-4 bg-[var(--bg-main)]/95 px-2 py-2 backdrop-blur-sm">
        <FilterBar
          filters={filters}
          onChange={(next) => onFilterChange(next as Partial<typeof filters>)}
          onReset={onReset}
          providerOptions={filterOptions?.providers ?? []}
          serviceOptions={filterOptions?.services ?? []}
          regionOptions={filterOptions?.regions ?? []}
          compactMobile
          tight
        />
      </div>

      {overviewData && (
        <div className="relative flex-1 space-y-5 pb-12">
          {isFiltering && <SectionRefreshOverlay label="Refreshing executive overview..." />}

          <ExecutiveKpiStrip
            cards={kpiCards}
            activeKey={activeKpiKey}
            onOpenLink={(card) => {
              if (card.deepLink) navigate(card.deepLink);
            }}
            onCardClick={(card) => {
              if (activeKpiKey === card.key) {
                setActiveKpiKey(null);
                setActiveInsight(null);
                return;
              }
              setActiveKpiKey(card.key);
              setActiveInsight(card.info);
            }}
          />

          <KpiInsightModal
            open={Boolean(activeInsight)}
            title={activeInsight?.title || "KPI Insight"}
            value={activeInsight?.value || null}
            summary={activeInsight?.summary || null}
            points={activeInsight?.details || []}
            contextLabel={activeInsight?.contextLabel || null}
            badgeText={activeInsight?.badgeText || null}
            onClose={() => {
              setActiveKpiKey(null);
              setActiveInsight(null);
            }}
            maxWidthClass="max-w-lg"
          />

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <TopMoversPreview movers={movers} confidenceFallback={confidenceLevel} />
            <TopActionsPreview actions={actions} />
            <AnomalySpotlightPreview anomalies={anomalies} />
          </section>

          <TrustFooterStrip
            lastDataRefreshAt={dataTrust?.lastDataRefreshAt}
            freshnessHours={dataTrust?.freshnessHours}
            providerCoveragePercent={providerCoveragePercent}
            costCoveragePercent={costCoveragePercent}
            allocatedPercent={allocatedPercent}
            confidenceLevel={confidenceLevel}
          />
        </div>
      )}

      {!overviewData && !loading && !isFiltering && (
        <div className="flex min-h-[400px] flex-1 items-center justify-center">
          <OverviewStates type="empty" />
        </div>
      )}
    </div>
  );
};

export default OverviewView;



