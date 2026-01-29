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

  // Special empty case (same as your original)
  if (overviewData?.message === "No upload selected. Please select a billing upload.") {
    return <OverviewStates type="noUpload" />;
  }

  // Initial loading
  if (loading && !overviewData) {
    return <OverviewStates type="loading" />;
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
      {/* FILTERS */}
      <div className="shrink-0 space-y-4 mb-4">
        <FilterBar
          filters={filters}
          onChange={onFilterChange}
          onReset={onReset}
          providerOptions={filterOptions.providers}
          serviceOptions={filterOptions.services}
          regionOptions={filterOptions.regions}
        />
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto relative min-h-0">
        {isFiltering && overviewData && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-[#1a1b20]/90 backdrop-blur-md border border-[#a02ff1]/30 rounded-lg px-3 py-2 shadow-lg">
            <span className="text-xs text-gray-300 font-medium">Filtering...</span>
          </div>
        )}

        {!overviewData ? (
          <OverviewStates type="empty" />
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default OverviewView;
