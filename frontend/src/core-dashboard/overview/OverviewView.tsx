import React from "react";
import { Database, Clock } from "lucide-react";
import FilterBar from "../common/widgets/FilterBar";
import CostTrendChart from "../common/widgets/CostTrendChart";
import ServiceSpendChart from "../common/widgets/ServiceSpendChart";
import MostPopularRegion from "../common/widgets/MostPopularRegion";

import PremiumGate from "../common/PremiumGate";
import { SectionLoading, SectionRefreshOverlay } from "../common/SectionStates";
import OverviewStates from "./components/OverviewStates";
import OverviewKpiGrid from "./components/OverviewKpiGrid";

const OverviewView = ({
  filters,
  filterOptions,
  onFilterChange,
  onReset,
  loading,
  isFiltering,
  overviewData,
  extractedData,
  filteredGroupedData,
  chartFilters,
  onTrendLimitChange,
  onBarLimitChange,
  isLocked,
}) => {
  const {
    totalSpend,
    dailyData,
    allRegionData,
    topRegion,
    topService,
    spendChangePercent,
    topProvider,
    untaggedCost,
    missingMetadataCost,
    billingPeriod,
    topRegionPercent,
    topServicePercent,
    avgDailySpend,
  } = extractedData;

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
          onChange={onFilterChange}
          onReset={onReset}
          providerOptions={filterOptions?.providers ?? []}
          serviceOptions={filterOptions?.services ?? []}
          regionOptions={filterOptions?.regions ?? []}
          compactMobile
          tight
        />
      </div>

      {overviewData && (
        <div className="flex-1 space-y-5 pb-12">
          <section className="relative">
            <OverviewKpiGrid
              spend={totalSpend}
              topRegion={topRegion}
              topService={topService}
              spendChangePercent={spendChangePercent}
              topProvider={topProvider}
              untaggedCost={untaggedCost}
              missingMetadataCost={missingMetadataCost}
              billingPeriod={billingPeriod}
              topRegionPercent={topRegionPercent}
              topServicePercent={topServicePercent}
            />
            {isFiltering && <SectionRefreshOverlay label="Updating KPI cards..." />}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <CostTrendChart
                data={dailyData}
                limit={chartFilters.trendChart.limit}
                onLimitChange={onTrendLimitChange}
                billingPeriod={billingPeriod}
                avgDailySpend={avgDailySpend}
              />
              {isFiltering && <SectionRefreshOverlay label="Refreshing trend chart..." />}
            </div>

            <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              {isLocked ? (
                <PremiumGate
                  title="Service Breakdown"
                  description="Unlock detailed service-level cost analysis."
                >
                  <div className="pointer-events-none h-full opacity-20 blur-sm">
                    <ServiceSpendChart
                      data={filteredGroupedData}
                      title="Spend by Service"
                      limit={chartFilters.barChart.limit}
                      onLimitChange={() => {}}
                      totalSpend={totalSpend}
                    />
                  </div>
                </PremiumGate>
              ) : (
                <ServiceSpendChart
                  data={filteredGroupedData}
                  title="Spend by Service"
                  limit={chartFilters.barChart.limit}
                  onLimitChange={onBarLimitChange}
                  totalSpend={totalSpend}
                />
              )}
              {isFiltering && <SectionRefreshOverlay label="Refreshing service chart..." />}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <MostPopularRegion
              data={allRegionData}
              totalSpend={totalSpend}
              billingPeriod={billingPeriod}
            />
            {isFiltering && <SectionRefreshOverlay label="Refreshing regional view..." />}
          </section>

          <div className="flex items-center justify-end gap-6 border-t border-slate-200/60 pt-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Database size={12} />
              <span>Source: Standard CSV Ingestion</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Clock size={12} />
              <span>
                Report Generated:{" "}
                <span className="text-slate-600">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </span>
            </div>
          </div>
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
