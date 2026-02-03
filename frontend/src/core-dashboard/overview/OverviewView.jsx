import { Loader2 } from "lucide-react";
import FilterBar from "../common/widgets/FilterBar.jsx";
import CostTrendChart from "../common/widgets/CostTrendChart.jsx";
import ServiceSpendChart from "../common/widgets/ServiceSpendChart.jsx";
import MostPopularRegion from "../common/widgets/MostPopularRegion.jsx";

import PremiumGate from "../common/PremiumGate.jsx";
import OverviewStates from "./components/OverviewStates.jsx";
import OverviewKpiGrid from "./components/OverviewKpiGrid.jsx";

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

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
      {/* FILTERS */}
      <div className="shrink-0 space-y-4 mb-4">
        <FilterBar
          filters={filters}
          onChange={onFilterChange}
          onReset={onReset}
          providerOptions={filterOptions?.providers ?? []}
          serviceOptions={filterOptions?.services ?? []}
          regionOptions={filterOptions?.regions ?? []}
        />
      </div>

      {/* CONTENT - loading overlay only when no data yet; keep showing current output while filtering */}
      <div className="flex-1 overflow-y-auto relative min-h-[50vh]">
        {loading && !overviewData && (
          <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f11]/95 backdrop-blur-sm rounded-xl border border-white/5"
            aria-busy="true"
            aria-live="polite"
          >
            <Loader2 className="animate-spin text-[#a02ff1]" size={40} strokeWidth={2} />
            <p className="mt-3 text-sm font-medium text-gray-400">Loading overview…</p>
          </div>
        )}

        {!overviewData && !loading ? (
          <OverviewStates type="empty" />
        ) : overviewData ? (
          <div className="space-y-4">
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <CostTrendChart
                data={dailyData}
                limit={chartFilters.trendChart.limit}
                onLimitChange={onTrendLimitChange}
                billingPeriod={billingPeriod}
                avgDailySpend={avgDailySpend}
              />

              {/* Spend by Service Chart - Premium */}
              {isLocked ? (
                <PremiumGate>
                  <ServiceSpendChart
                    data={filteredGroupedData}
                    title="Spend by Service"
                    limit={chartFilters.barChart.limit}
                    onLimitChange={() => {}}
                    totalSpend={totalSpend}
                  />
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
            </div>

            {/* Most Popular Region */}
            <div className="w-full">
              <MostPopularRegion
                data={allRegionData}
                totalSpend={totalSpend}
                billingPeriod={billingPeriod}
              />
            </div>

            <div className="flex justify-end items-center gap-4 pt-4 border-t border-white/5 text-[10px] text-gray-500">
              <span>Data source: Database</span>
              <span>•</span>
              <span>
                Last processed:{" "}
                {new Date().toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OverviewView;
