import React, { useMemo, useState } from "react";
import type {
  CostAnalysisFilterOptions,
  SpendAnalyticsFilterPatch,
  SpendAnalyticsFilters,
  SpendAnalyticsPayload,
} from "./types";
import GlobalControlsSection from "./components/sections/GlobalControlsSection";
import SpendTrendSection from "./components/sections/SpendTrendSection";
import BreakdownCompositionSection from "./components/sections/BreakdownCompositionSection";
import ConcentrationSection from "./components/sections/ConcentrationSection";
import TrustCueSection from "./components/sections/TrustCueSection";
import SpendDistributionSection from "./components/sections/SpendDistributionSection";
import { SectionRefreshOverlay } from "../common/SectionStates";

interface CostAnalysisViewProps {
  filters: SpendAnalyticsFilters;
  onFiltersChange: (patch: SpendAnalyticsFilterPatch) => void;
  onResetFilters: () => void;
  filterOptions: CostAnalysisFilterOptions;
  spendAnalytics: SpendAnalyticsPayload | null;
  message: string;
  isLoading: boolean;
}

const FALLBACK_OPTIONS = {
  timeRanges: ["7d", "30d", "90d", "mtd", "qtd", "custom"],
  granularities: ["daily", "weekly", "monthly"],
  compareTo: ["previous_period", "same_period_last_month", "none"],
  costBasis: ["actual", "amortized", "net"],
  currencyModes: ["usd"],
  groupBy: ["ServiceName", "RegionName", "ProviderName", "Account", "Team", "App", "Env", "CostCategory"],
};

const DEFAULT_FILTER_VALUES: Pick<
  SpendAnalyticsFilters,
  | "provider"
  | "service"
  | "region"
  | "account"
  | "subAccount"
  | "app"
  | "team"
  | "env"
  | "costCategory"
  | "tagKey"
  | "tagValue"
> = {
  provider: "All",
  service: "All",
  region: "All",
  account: "All",
  subAccount: "All",
  app: "All",
  team: "All",
  env: "All",
  costCategory: "All",
  tagKey: "",
  tagValue: "",
};

const CostAnalysisView = ({
  filters,
  onFiltersChange,
  onResetFilters,
  filterOptions,
  spendAnalytics,
  message,
  isLoading,
}: CostAnalysisViewProps) => {
  const [showMediumFilters, setShowMediumFilters] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  const selectedFilterCount = useMemo(() => {
    let count = 0;
    (Object.keys(DEFAULT_FILTER_VALUES) as Array<keyof typeof DEFAULT_FILTER_VALUES>).forEach((key) => {
      if (filters[key] !== DEFAULT_FILTER_VALUES[key]) count += 1;
    });
    return count;
  }, [filters]);

  if (!spendAnalytics) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-base font-bold text-slate-700">{message || "No spend analytics data available."}</p>
      </div>
    );
  }

  const optionBag = spendAnalytics.controls?.options || FALLBACK_OPTIONS;
  return (
    <div className="space-y-5">
      <GlobalControlsSection
        selectedFilterCount={selectedFilterCount}
        showMediumFilters={showMediumFilters}
        showAdvancedFilters={showAdvancedFilters}
        filters={filters}
        filterOptions={filterOptions}
        timeRangeOptions={optionBag.timeRanges as string[]}
        granularityOptions={optionBag.granularities as string[]}
        compareOptions={optionBag.compareTo as string[]}
        costBasisOptions={optionBag.costBasis as string[]}
        currencyModeOptions={optionBag.currencyModes as string[]}
        groupByOptions={optionBag.groupBy as string[]}
        onFiltersChange={onFiltersChange}
        onToggleMediumFilters={() =>
          setShowMediumFilters((prev) => {
            const next = !prev;
            if (!next) setShowAdvancedFilters(false);
            return next;
          })
        }
        onToggleAdvancedFilters={() => showMediumFilters && setShowAdvancedFilters((prev) => !prev)}
        onResetAll={() => {
          setShowAdvancedFilters(false);
          setShowMediumFilters(false);
          onResetFilters();
        }}
      />
      <div className="relative">
        {isLoading ? <SectionRefreshOverlay label="Refreshing cost analysis..." rounded="rounded-3xl" /> : null}
        <div className="space-y-5">
          <TrustCueSection trust={spendAnalytics.trust} filters={filters} />
          <SpendDistributionSection
            spendDistribution={spendAnalytics.spendDistribution}
            controls={spendAnalytics.controls}
          />

          <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-12">
            <div className="xl:col-span-8 xl:h-full">
              <SpendTrendSection trend={spendAnalytics.trend} trust={spendAnalytics.trust} filters={filters} />
            </div>
            <div className="xl:col-span-4 xl:h-full">
              <BreakdownCompositionSection
                breakdown={spendAnalytics.breakdown}
                filters={filters}
                onFiltersChange={onFiltersChange}
                serviceKeys={spendAnalytics.trend.activeKeys}
              />
            </div>
          </section>

          <ConcentrationSection
            concentration={spendAnalytics.concentration}
            concentrationPareto={spendAnalytics.concentrationPareto}
          />
        </div>
      </div>
    </div>
  );
};

export default CostAnalysisView;



