import React from "react";
import type {
  CostAnalysisFilterOptions,
  SpendAnalyticsFilterPatch,
  SpendAnalyticsFilters,
  SpendAnalyticsPayload,
} from "./types";
import { BREAKDOWN_FILTER_MAP, BREAKDOWN_TABS } from "./utils/view.constants";
import GlobalControlsSection from "./components/sections/GlobalControlsSection";
import KpiDeckSection from "./components/sections/KpiDeckSection";
import BusinessProviderInsightsSection from "./components/sections/BusinessProviderInsightsSection";
import TrendBreakdownSection from "./components/sections/TrendBreakdownSection";
import PostAnalysisSections from "./components/sections/PostAnalysisSections";
import { useCostAnalysisViewModel } from "./hooks/useCostAnalysisViewModel";

interface CostAnalysisViewProps {
  filters: SpendAnalyticsFilters;
  onFiltersChange: (patch: SpendAnalyticsFilterPatch) => void;
  onResetFilters: () => void;
  filterOptions: CostAnalysisFilterOptions;
  spendAnalytics: SpendAnalyticsPayload | null;
  message: string;
  isLoading: boolean;
}

const CostAnalysisView = ({
  filters,
  onFiltersChange,
  onResetFilters,
  filterOptions,
  spendAnalytics,
  message,
  isLoading,
}: CostAnalysisViewProps) => {
  const vm = useCostAnalysisViewModel({
    filters,
    onFiltersChange,
    onResetFilters,
    spendAnalytics,
  });

  if (!spendAnalytics) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-base font-bold text-slate-700">{message || "No spend analytics data available."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GlobalControlsSection
        selectedFilterCount={vm.selectedFilterCount}
        showMediumFilters={vm.showMediumFilters}
        showAdvancedFilters={vm.showAdvancedFilters}
        filters={filters}
        filterOptions={filterOptions}
        timeRangeOptions={vm.controlOptions.timeRangeOptions}
        granularityOptions={vm.controlOptions.granularityOptions}
        compareOptions={vm.controlOptions.compareOptions}
        costBasisOptions={vm.controlOptions.costBasisOptions}
        groupByOptions={vm.controlOptions.groupByOptions}
        onFiltersChange={onFiltersChange}
        onToggleMediumFilters={() =>
          vm.setShowMediumFilters((prev) => {
            const next = !prev;
            if (!next) vm.setShowAdvancedFilters(false);
            return next;
          })
        }
        onToggleAdvancedFilters={() => vm.showMediumFilters && vm.setShowAdvancedFilters((prev) => !prev)}
        onResetAll={vm.resetAllFilters}
      />

      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Scope</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Period: {vm.scopeContext.periodLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Granularity: {vm.scopeContext.granularityLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Basis: {vm.scopeContext.costBasisLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Compare: {vm.scopeContext.compareLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Group: {vm.scopeContext.groupByLabel}
          </span>
        </div>
      </section>

      <KpiDeckSection
        kpiInsights={vm.kpiInsights}
        activeKpiInsight={vm.activeKpiInsight}
        onToggleKpi={vm.toggleKpiInsight}
        onCloseInsight={vm.closeKpiInsight}
        contextLabel={`${vm.scopeContext.periodLabel} | ${vm.scopeContext.granularityLabel} | ${vm.scopeContext.compareLabel}`}
      />

      <BusinessProviderInsightsSection
        businessInsights={vm.businessInsights}
        selectedProvider={filters.provider}
        providerBreakdown={vm.providerBreakdown}
        regionBreakdown={vm.regionBreakdown}
        topServiceMix={vm.topServiceMix}
        top5ServiceShare={vm.top5ServiceShare}
        topRegion={vm.topRegion}
        onProviderSelect={(provider) => onFiltersChange({ provider })}
      />

      <TrendBreakdownSection
        compareLabel={vm.compareLabel}
        trendSeries={vm.trendSeries}
        normalizedChart={vm.normalizedChart}
        legendSeriesKeys={vm.legendSeriesKeys}
        hiddenSeries={vm.hiddenSeries}
        palette={vm.palette}
        breakdownState={{
          rows: vm.breakdownRows,
          tab: vm.breakdownTab,
          tabLabel: vm.activeBreakdownTabLabel,
          activeFilterValue: vm.activeBreakdownFilterValue,
          tabs: BREAKDOWN_TABS,
          filterMap: BREAKDOWN_FILTER_MAP,
        }}
        breakdownListRef={vm.breakdownListRef}
        filters={filters}
        onToggleSeries={vm.toggleSeries}
        onResetBreakdownFilters={vm.resetBreakdownFilters}
        onSetBreakdownTab={vm.setBreakdownTab}
        onApplyBreakdownFilter={vm.applyBreakdownFilter}
      />

      <PostAnalysisSections
        anomalyHighlights={vm.anomalyHighlights}
        predictabilityScore={spendAnalytics.predictabilityRisk.predictabilityScore}
        volatilityScore={spendAnalytics.predictabilityRisk.volatilityScore}
        forecast={vm.forecast}
        riskRows={vm.riskRows}
        drilldownPaths={spendAnalytics.drilldownPaths}
      />

      {isLoading ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          Refreshing spend analytics...
        </div>
      ) : null}
      <style>{`
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
};

export default CostAnalysisView;
