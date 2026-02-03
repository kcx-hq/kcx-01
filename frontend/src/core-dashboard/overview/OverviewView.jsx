import { Loader2 } from "lucide-react";
import FilterBar from "../common/widgets/FilterBar.jsx";
import CostTrendChart from "../common/widgets/CostTrendChart.jsx";
import ServiceSpendChart from "../common/widgets/ServiceSpendChart.jsx";
import MostPopularRegion from "../common/widgets/MostPopularRegion.jsx";

import PremiumGate from "../common/PremiumGate.jsx";
import OverviewStates from "./components/OverviewStates.jsx";
import OverviewKpiGrid from "./components/OverviewKpiGrid.jsx";


// ... (keep your existing imports)



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
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full relative">
      {/* FILTERS */}
      <div className="shrink-0 space-y-4 mb-6">
        <FilterBar
          filters={filters}
          onChange={onFilterChange}
          onReset={onReset}
          providerOptions={filterOptions?.providers ?? []}
          serviceOptions={filterOptions?.services ?? []}
          regionOptions={filterOptions?.regions ?? []}
        />
      </div>
      
      {/* Loading Section - Appears below filter bar */}
      {(loading || isFiltering) && (
        <div className="flex items-center justify-center py-12 bg-[#0f0f11]/50 rounded-2xl border border-white/5 mb-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <Loader2 className="animate-spin text-[#a02ff1] w-10 h-10" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-t-[#a02ff1]/80 rounded-full animate-spin" style={{animationDuration: '1s'}}></div>
            </div>
            <div>
              <h3 className="text-gray-200 font-semibold text-lg">
                {loading ? "Loading dashboard data..." : "Updating your filters..."}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {loading ? "Please wait while we fetch your overview information" : "Applying your selected filter preferences"}
              </p>
            </div>
            <div className="flex justify-center space-x-1 mt-2">
              <div className="w-2 h-2 bg-[#a02ff1]/60 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-[#a02ff1]/60 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
              <div className="w-2 h-2 bg-[#a02ff1]/60 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT - Only shows when data is loaded */}
      {overviewData && !loading && !isFiltering && (
        <div className="flex-1 overflow-y-auto min-h-[50vh] animate-in fade-in duration-500">
          <div className="space-y-6">
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <CostTrendChart
                data={dailyData}
                limit={chartFilters.trendChart.limit}
                onLimitChange={onTrendLimitChange}
                billingPeriod={billingPeriod}
                avgDailySpend={avgDailySpend}
              />

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

            <div className="w-full">
              <MostPopularRegion
                data={allRegionData}
                totalSpend={totalSpend}
                billingPeriod={billingPeriod}
              />
            </div>



            <div className="flex justify-end items-center gap-4 pt-6 border-t border-white/10 text-xs text-gray-500">
              <span>Data source: Database</span>
              <span>•</span>
              <span>
                Last processed: {new Date().toLocaleDateString("en-US", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty state when no data and not loading */}
      {!overviewData && !loading && !isFiltering && (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <OverviewStates type="empty" />
        </div>
      )}
    </div>
  );
};

export default OverviewView;