import React from "react";
import { ChevronDown, ChevronUp, Filter, SlidersHorizontal } from "lucide-react";
import type {
  CostAnalysisFilterOptions,
  SpendAnalyticsFilterPatch,
  SpendAnalyticsFilters,
} from "../../types";
import SelectControl from "../shared/SelectControl";

interface GlobalControlsSectionProps {
  selectedFilterCount: number;
  showMediumFilters: boolean;
  showAdvancedFilters: boolean;
  filters: SpendAnalyticsFilters;
  filterOptions: CostAnalysisFilterOptions;
  timeRangeOptions: string[];
  granularityOptions: string[];
  compareOptions: string[];
  costBasisOptions: string[];
  currencyModeOptions: string[];
  groupByOptions: string[];
  onFiltersChange: (patch: SpendAnalyticsFilterPatch) => void;
  onToggleMediumFilters: () => void;
  onToggleAdvancedFilters: () => void;
  onResetAll: () => void;
}

const GlobalControlsSection = ({
  selectedFilterCount,
  showMediumFilters,
  showAdvancedFilters,
  filters,
  filterOptions,
  timeRangeOptions,
  granularityOptions,
  compareOptions,
  costBasisOptions,
  currencyModeOptions,
  groupByOptions,
  onFiltersChange,
  onToggleMediumFilters,
  onToggleAdvancedFilters,
  onResetAll,
}: GlobalControlsSectionProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-emerald-700" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Filters</h2>
          {selectedFilterCount > 0 ? (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              {selectedFilterCount} active
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMediumFilters}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:border-emerald-200 hover:text-emerald-700"
          >
            Medium
            {showMediumFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={onToggleAdvancedFilters}
            disabled={!showMediumFilters}
            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-wider ${
              showMediumFilters
                ? "border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-700"
                : "cursor-not-allowed border-slate-100 text-slate-300"
            }`}
          >
            Advanced
            {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={onResetAll}
            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:border-emerald-200 hover:text-emerald-700"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <SelectControl
          label="Time Range"
          value={filters.timeRange}
          options={timeRangeOptions}
          onChange={(value) => onFiltersChange({ timeRange: value as SpendAnalyticsFilters["timeRange"] })}
        />
        <SelectControl
          label="Granularity"
          value={filters.granularity}
          options={granularityOptions}
          onChange={(value) => onFiltersChange({ granularity: value as SpendAnalyticsFilters["granularity"] })}
        />
        <SelectControl
          label="Compare To"
          value={filters.compareTo}
          options={compareOptions}
          onChange={(value) => onFiltersChange({ compareTo: value as SpendAnalyticsFilters["compareTo"] })}
        />
        <SelectControl
          label="Provider"
          value={filters.provider}
          options={filterOptions.providers}
          onChange={(value) => onFiltersChange({ provider: value })}
        />
        <SelectControl
          label="Service"
          value={filters.service}
          options={filterOptions.services}
          onChange={(value) => onFiltersChange({ service: value })}
        />
        <SelectControl
          label="Region"
          value={filters.region}
          options={filterOptions.regions}
          onChange={(value) => onFiltersChange({ region: value })}
        />
      </div>

      {showMediumFilters ? (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Medium Filters
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <SelectControl
              label="Account"
              value={filters.account}
              options={filterOptions.accounts}
              onChange={(value) => onFiltersChange({ account: value })}
            />
            <SelectControl
              label="Team"
              value={filters.team}
              options={filterOptions.teams}
              onChange={(value) => onFiltersChange({ team: value })}
            />
            <SelectControl
              label="App"
              value={filters.app}
              options={filterOptions.apps}
              onChange={(value) => onFiltersChange({ app: value })}
            />
            <SelectControl
              label="Environment"
              value={filters.env}
              options={filterOptions.envs}
              onChange={(value) => onFiltersChange({ env: value })}
            />
            <SelectControl
              label="Cost Category"
              value={filters.costCategory}
              options={filterOptions.costCategories}
              onChange={(value) => onFiltersChange({ costCategory: value })}
            />
            <SelectControl
              label="Cost Basis"
              value={filters.costBasis}
              options={costBasisOptions}
              onChange={(value) => onFiltersChange({ costBasis: value as SpendAnalyticsFilters["costBasis"] })}
            />
            <SelectControl
              label="Currency"
              value={filters.currencyMode}
              options={currencyModeOptions}
              onChange={(value) => onFiltersChange({ currencyMode: value as SpendAnalyticsFilters["currencyMode"] })}
            />
            <SelectControl
              label="Group By"
              value={filters.groupBy}
              options={groupByOptions}
              onChange={(value) => onFiltersChange({ groupBy: value as SpendAnalyticsFilters["groupBy"] })}
            />
          </div>
        </div>
      ) : null}

      {showMediumFilters && showAdvancedFilters ? (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Advanced Filters
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <SelectControl
              label="Sub Account"
              value={filters.subAccount}
              options={filterOptions.subAccounts}
              onChange={(value) => onFiltersChange({ subAccount: value })}
            />
            <SelectControl
              label="Tag Key"
              value={filters.tagKey || ""}
              options={["", ...filterOptions.tagKeys]}
              onChange={(value) => onFiltersChange({ tagKey: value })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tag Value</label>
              <input
                type="text"
                value={filters.tagValue}
                onChange={(event) => onFiltersChange({ tagValue: event.target.value })}
                placeholder="Optional exact tag value"
                className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {filters.timeRange === "custom" ? (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => onFiltersChange({ startDate: event.target.value })}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) => onFiltersChange({ endDate: event.target.value })}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default GlobalControlsSection;
