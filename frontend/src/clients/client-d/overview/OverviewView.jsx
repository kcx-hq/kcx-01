import FilterBar from "../../../core-dashboard/common/widgets/FilterBar.jsx";
import OverviewKpiGrid from "./components/OverviewKpiGrid.jsx";
import CostTrendChart from "../../../core-dashboard/common/widgets/CostTrendChart.jsx";
import ServiceSpendChart from "../../../core-dashboard/common/widgets/ServiceSpendChart.jsx";
import PremiumGate from "../../../core-dashboard/common/PremiumGate.jsx";
import OverviewStates from "../../../core-dashboard/overview/components/OverviewStates.jsx";

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
  
    billingPeriod,
 
    avgDailySpend,
  } = extractedData;

  if (overviewData?.message === "No upload selected. Please select a billing upload.") {
    return <OverviewStates type="noUpload" />;
  }

  if (loading && !overviewData) {
    return <OverviewStates type="loading" />;
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
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

      <div className="flex-1 overflow-y-auto relative min-h-0">
        {isFiltering && overviewData && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-[#ffffff]/90 backdrop-blur-md border border-[#1EA88A]/30 rounded-lg px-3 py-2 shadow-lg">
            <span className="text-xs text-gray-300 font-medium">Filtering...</span>
          </div>
        )}

        {!overviewData ? (
          <OverviewStates type="empty" />
        ) : (
          <div className="space-y-4">
            <OverviewKpiGrid
              extractedData={extractedData}
              locked={isLocked}
            />
             

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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

            {/* ✅ Region widget removed because Client-D response doesn’t include region breakdown */}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewView;
