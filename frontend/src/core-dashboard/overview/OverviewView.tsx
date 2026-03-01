import React, { useMemo, useState } from "react";
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
  const executiveOverview = extractedData.executiveOverview;
  const kpis = executiveOverview.kpiHeader;
  const budgetBurn = executiveOverview.outcomeAndRisk.budgetBurn;
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

  const mtdPresentation = kpis.presentation?.mtdSpend || {
    comparison: "vs prior 0.0%",
    comparisonValue: 0,
    status: "On track",
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
  const daysElapsed = toSafeNumber(calcContext?.daysElapsed);
  const daysInMonth = toSafeNumber(calcContext?.daysInMonth);
  const daysRemaining = toSafeNumber(calcContext?.daysRemaining);
  const runRatePerDay = toSafeNumber(calcContext?.runRatePerDay || budgetBurn?.burnRatePerDay);
  const budgetSource = calcContext?.budgetSource || "Auto baseline";
  const realizedSavingsMethod =
    calcContext?.realizedSavingsMethod || "Sum(max(ListCost - EffectiveCost, 0)) within current month window";
  const pipelineSavingsValue = toSafeNumber(kpis.pipelineSavings);
  const realizedCoveragePercent = toSafeNumber(realizedPresentation?.coveragePercent);

  const kpiCards = useMemo<ExecutiveKpiCardModel[]>(
    () => [
      {
        key: "mtd-spend",
        label: "MTD Spend",
        value: formatUSD(kpis.mtdSpend),
        comparison: mtdPresentation.comparison,
        comparisonValue: toSafeNumber(mtdPresentation.comparisonValue),
        status: mtdPresentation.status,
        info: {
          title: "MTD Spend",
          value: formatUSD(kpis.mtdSpend),
          summary: "Month-to-date spend based on processed billing rows up to the as-of date.",
          contextLabel: `${monthStartDate} to ${asOfDate}`,
          badgeText: mtdPresentation.status,
          details: [
            `Days included: ${daysElapsed} of ${daysInMonth}`,
            `Average daily run-rate: ${formatUSD(runRatePerDay)} per day`,
            `Change vs prior period: ${formatSignedPct(kpis.mtdSpendDeltaPercent)}`,
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
        info: {
          title: "EOM Forecast",
          value: formatUSD(kpis.eomForecast),
          summary: "Projected end-of-month spend using current MTD run-rate and remaining days.",
          contextLabel: `${asOfDate} to ${monthEndDate}`,
          badgeText: forecastPresentation.status,
          details: [
            `Forecast horizon: ${asOfDate} to ${monthEndDate}`,
            `Days remaining: ${daysRemaining}`,
            `Run-rate used: ${formatUSD(runRatePerDay)} per day`,
            `Budget gap: ${formatUSD(forecastDeltaValue)} (${forecastPresentation.comparison})`,
          ],
        },
      },
      {
        key: "budget-variance",
        label: "Budget Variance",
        value: formatUSD(kpis.budgetVarianceValue),
        comparison: variancePresentation.comparison,
        comparisonValue: toSafeNumber(variancePresentation.comparisonValue),
        status: variancePresentation.status,
        info: {
          title: "Budget Variance",
          value: formatUSD(kpis.budgetVarianceValue),
          summary: "Difference between EOM forecast and approved monthly budget.",
          contextLabel: `As of ${asOfDate}`,
          badgeText: variancePresentation.status,
          details: [
            `Formula: EOM Forecast - Budget`,
            `EOM Forecast: ${formatUSD(kpis.eomForecast)}`,
            `Budget baseline: ${formatUSD(kpis.budget)} (${budgetSource})`,
            `Variance: ${formatUSD(kpis.budgetVarianceValue)} (${formatSignedPct(kpis.budgetVariancePercent)})`,
          ],
        },
      },
      {
        key: "realized-savings",
        label: "Realized Savings (MTD)",
        value: formatUSD(kpis.realizedSavingsMtd),
        comparison: realizedPresentation.comparison,
        comparisonValue: toSafeNumber(realizedPresentation.comparisonValue),
        status: realizedPresentation.status,
        info: {
          title: "Realized Savings (MTD)",
          value: formatUSD(kpis.realizedSavingsMtd),
          summary: "Savings realized this month from effective pricing versus list pricing.",
          contextLabel: `As of ${asOfDate}`,
          badgeText: realizedPresentation.status,
          details: [
            `Calculation: ${realizedSavingsMethod}`,
            `Realized savings value: ${formatUSD(kpis.realizedSavingsMtd)}`,
            `Savings pipeline: ${formatUSD(kpis.pipelineSavings)}`,
            pipelineSavingsValue > 0
              ? `Pipeline attainment: ${realizedCoveragePercent.toFixed(1)}%`
              : "Pipeline attainment: not available",
          ],
        },
      },
    ],
    [
      asOfDate,
      budgetSource,
      daysElapsed,
      daysInMonth,
      daysRemaining,
      forecastDeltaValue,
      kpis.budget,
      kpis.budgetVariancePercent,
      kpis.budgetVarianceValue,
      kpis.eomForecast,
      kpis.mtdSpend,
      kpis.mtdSpendDeltaPercent,
      kpis.pipelineSavings,
      kpis.presentation,
      kpis.realizedSavingsMtd,
      monthEndDate,
      monthStartDate,
      pipelineSavingsValue,
      realizedCoveragePercent,
      realizedSavingsMethod,
      runRatePerDay,
    ]
  );

  const movers = (topMovers?.drivers || []).slice(0, 5);
  const actions = (actionCenter?.actions || []).slice(0, 5);
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



