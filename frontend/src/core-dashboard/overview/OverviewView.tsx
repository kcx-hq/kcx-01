import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterBar from "../common/widgets/FilterBar";
import KpiInsightModal from "../common/components/KpiInsightModal";
import { SectionLoading, SectionRefreshOverlay } from "../common/SectionStates";
import OverviewStates from "./components/OverviewStates";
import BudgetBurnPaceWidget from "./components/executive/BudgetBurnPaceWidget";
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
  const budgetBurn = executiveOverview.outcomeAndRisk.budgetBurn;
  const riskFlags = executiveOverview.outcomeAndRisk.riskFlags || [];
  const topMovers = executiveOverview.topMovers;
  const actionCenter = executiveOverview.actionCenter;
  const anomalySpotlight = executiveOverview.anomalySpotlight;
  const dataTrust = executiveOverview.dataTrust;

  const [activeKpiKey, setActiveKpiKey] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<ExecutiveKpiInfoModel | null>(null);

  const forecastDeltaValue = toSafeNumber(kpis.budgetVarianceValue);
  const budgetValue = toSafeNumber(kpis.budget);
  const providerCoveragePercent = toSafeNumber(dataTrust?.providerCoveragePercent);
  const costCoveragePercent = toSafeNumber(dataTrust?.costCoveragePercent);
  const allocatedPercent = toSafeNumber(dataTrust?.allocationPercent);
  const confidenceLevel = dataTrust?.confidenceLevel || "Low";
  const trend7dDeltaPercent = toSafeNumber(kpis.trend7dDeltaPercent);
  const trend30dDeltaPercent = toSafeNumber(kpis.trend30dDeltaPercent);
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

  const forecastPresentation = kpis.presentation?.eomForecast || {
    comparison: "vs budget 0.0%",
    comparisonValue: 0,
    status: "On track",
  };
  const variancePresentation = kpis.presentation?.budgetVariance || {
    comparison: "variance 0.0%",
    comparisonValue: 0,
    status: "On track",
  };
  const trendPresentation = kpis.presentation?.costTrend || {
    comparison: "30d 0.0%",
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
  const mtdBudgetUsePct = budgetValue > 0 ? (toSafeNumber(kpis.mtdSpend) / budgetValue) * 100 : 0;
  const daysRemaining = toSafeNumber(calcContext?.daysRemaining);
  const runRatePerDay = toSafeNumber(calcContext?.runRatePerDay);
  const budgetSource = calcContext?.budgetSource || "Auto baseline";
  const realizedSavingsMethod =
    calcContext?.realizedSavingsMethod || "Sum(max(ListCost - EffectiveCost, 0)) within current month window";
  const pipelineSavingsValue = toSafeNumber(kpis.pipelineSavings || potentialSavings30d);
  const realizedCoveragePercent = toSafeNumber(realizedPresentation?.coveragePercent);
  const actions = (actionCenter?.actions || []).slice(0, 5);

  const kpiCards = useMemo<ExecutiveKpiCardModel[]>(
    () => [
      {
        key: "mtd-spend-vs-budget",
        label: "MTD Spend vs Budget",
        value: formatUSD(kpis.mtdSpend),
        comparison: `${mtdBudgetUsePct.toFixed(1)}% of budget`,
        comparisonValue: roundToNumber(mtdBudgetUsePct - 100),
        status: variancePresentation.status,
        deepLink: ownerLinks.mtdSpend,
        metaTooltip: "Formula: MTD spend / Budget x 100. Source: Forecasting & Budgets.",
        info: {
          title: "MTD Spend vs Budget",
          value: formatUSD(kpis.mtdSpend),
          summary: "Current month spend compared with approved budget baseline.",
          contextLabel: `${monthStartDate} to ${asOfDate}`,
          badgeText: variancePresentation.status,
          details: [
            `Formula: MTD Spend / Budget`,
            `MTD spend: ${formatUSD(kpis.mtdSpend)}`,
            `Budget baseline: ${formatUSD(kpis.budget)} (${budgetSource})`,
            `Consumed: ${mtdBudgetUsePct.toFixed(1)}%`,
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
        key: "cost-trend",
        label: "Cost Trend (7d)",
        value: formatSignedPct(trend7dDeltaPercent),
        comparison: trendPresentation.comparison || `30d ${formatSignedPct(trend30dDeltaPercent)}`,
        comparisonValue: toSafeNumber(trendPresentation.comparisonValue || trend7dDeltaPercent),
        status: trendPresentation.status,
        deepLink: ownerLinks.costTrend,
        metaTooltip: "Formula: ((avg current window - avg previous window) / avg previous window) x 100.",
        info: {
          title: "Cost Trend (7d/30d)",
          value: `${formatSignedPct(trend7dDeltaPercent)} / ${formatSignedPct(trend30dDeltaPercent)}`,
          summary: "Short and medium-term trend against previous matching windows.",
          contextLabel: `As of ${asOfDate}`,
          badgeText: trendPresentation.status,
          details: [
            `7-day delta: ${formatSignedPct(trend7dDeltaPercent)}`,
            `30-day delta: ${formatSignedPct(trend30dDeltaPercent)}`,
            `Primary budget variance context: ${formatUSD(kpis.budgetVarianceValue)} (${formatSignedPct(kpis.budgetVariancePercent)})`,
            `Owner section: Cost Drivers`,
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
      budgetSource,
      budgetValue,
      trustScore,
      trend7dDeltaPercent,
      trend30dDeltaPercent,
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
      kpis.trend7dDeltaPercent,
      kpis.trend30dDeltaPercent,
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
      trendPresentation.comparison,
      trendPresentation.comparisonValue,
      trendPresentation.status,
      variancePresentation.status,
      providerCoveragePercent,
      costCoveragePercent,
      allocatedPercent,
      mtdBudgetUsePct,
      confidenceLevel,
    ]
  );
  const whyChanged = useMemo(
    () => {
      const movers = (topMovers?.drivers || []).slice(0, 2).map((driver, idx) => ({
        id: `driver-${idx + 1}`,
        label: `${driver?.name || "Cost driver"} ${driver?.direction === "decrease" ? "decreased" : "increased"} ${formatUSD(Math.abs(toSafeNumber(driver?.deltaValue)))}`,
        detail: driver?.reasonLabel || "Spend movement from rate/usage shift.",
        deepLink: topMovers?.driversLink || "/dashboard/cost-drivers",
      }));

      const activeRisks = riskFlags
        .filter((flag) => flag.active)
        .slice(0, 2)
        .map((flag, idx) => ({
          id: `risk-${idx + 1}`,
          label: `${flag.label} (${String(flag.severity || "low").toUpperCase()})`,
          detail:
            toSafeNumber(flag.metricPercent) > 0
              ? `${toSafeNumber(flag.metricPercent).toFixed(1)}% signal threshold crossed`
              : toSafeNumber(flag.metricHours) > 0
                ? `${toSafeNumber(flag.metricHours).toFixed(1)}h freshness lag`
                : toSafeNumber(flag.impactValue) > 0
                  ? `${formatUSD(toSafeNumber(flag.impactValue))} impact observed`
                  : "Control signal flagged in current scope.",
          deepLink: flag.ctaLink || "/dashboard/alerts-incidents",
        }));

      const combined = [...movers, ...activeRisks].slice(0, 3);
      if (combined.length) return combined;

      return [
        {
          id: "stable-baseline",
          label: "Spend posture remains stable",
          detail: "No dominant shift signal triggered in this scope.",
          deepLink: "/dashboard/cost-analysis",
        },
      ];
    },
    [riskFlags, topMovers?.drivers, topMovers?.driversLink]
  );
  const decisionThisWeek = useMemo(() => actions.slice(0, 3), [actions]);
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

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                    Why Spend Changed
                  </h3>
                  <p className="text-xs text-slate-500">Top 3 summary signals for this scope</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50"
                  onClick={() => navigate("/dashboard/cost-drivers")}
                >
                  Open Drivers
                </button>
              </div>
              <div className="space-y-2">
                {whyChanged.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left hover:border-slate-300"
                    onClick={() => navigate(item.deepLink)}
                  >
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-600">{item.detail}</p>
                  </button>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                    Decision This Week
                  </h3>
                  <p className="text-xs text-slate-500">Top 3 actions with impact and owner</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50"
                  onClick={() => navigate(actionCenter?.optimizationLink || "/dashboard/optimization")}
                >
                  Open Optimization
                </button>
              </div>
              <div className="space-y-2">
                {decisionThisWeek.length ? (
                  decisionThisWeek.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left hover:border-slate-300"
                      onClick={() => navigate(action.deepLink || actionCenter?.optimizationLink || "/dashboard/optimization")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-800">{action.title}</p>
                        <span className="text-xs font-bold text-emerald-700">{formatUSD(toSafeNumber(action.expectedSavings))}/mo</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-700">
                          Owner: {action.owner || "Unassigned"}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">
                          Status: {action.status || "Open"}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">
                          Confidence: {action.confidence || "Medium"}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    No prioritized actions found for this scope.
                  </p>
                )}
              </div>
            </article>
          </section>

          <BudgetBurnPaceWidget budgetBurn={budgetBurn} />

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



