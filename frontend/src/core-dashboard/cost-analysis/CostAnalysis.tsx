import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { SectionLoading } from "../common/SectionStates";
import CostAnalysisView from "./CostAnalysisView";
import { useCostFilters } from "./hooks/useCostFilters";
import { useCostAnalysis } from "./hooks/useCostAnalysis";
import type { DashboardFilters } from "../dashboard/types";
import {
  CostAnalysisApiClient,
  CostAnalysisApiData,
  CostAnalysisCaps,
  SpendAnalyticsFilterPatch,
  SpendAnalyticsFilters,
  SpendAnalyticsPayload,
  defaultSpendAnalyticsFilters,
} from "./types";

interface CostAnalysisProps {
  filters?: DashboardFilters;
  onFilterChange?: (patch: Partial<DashboardFilters>) => void;
  api: CostAnalysisApiClient | null | undefined;
  caps: CostAnalysisCaps | null | undefined;
}

const getSpendAnalytics = (data: CostAnalysisApiData | null): SpendAnalyticsPayload | null => {
  if (!data?.spendAnalytics) return null;
  return data.spendAnalytics;
};

const CostAnalysis = ({ filters: globalFilters, onFilterChange, api, caps }: CostAnalysisProps) => {
  const [filters, setFilters] = useState<SpendAnalyticsFilters>({
    ...defaultSpendAnalyticsFilters,
    provider: globalFilters?.provider || "All",
    service: globalFilters?.service || "All",
    region: globalFilters?.region || "All",
  });

  const { filterOptions } = useCostFilters({ api, caps });
  const { loading, isRefreshing, apiData, error } = useCostAnalysis({
    api,
    caps,
    filters,
  });

  useEffect(() => {
    if (!globalFilters) return;
    setFilters((prev) => ({
      ...prev,
      provider: globalFilters.provider || "All",
      service: globalFilters.service || "All",
      region: globalFilters.region || "All",
    }));
  }, [globalFilters?.provider, globalFilters?.service, globalFilters?.region]);

  const spendAnalytics = useMemo<SpendAnalyticsPayload | null>(
    () => getSpendAnalytics(apiData),
    [apiData]
  );

  const handleFilterChange = useCallback((patch: SpendAnalyticsFilterPatch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      if (onFilterChange) {
        const sharedPatch: Partial<DashboardFilters> = {};
        if (Object.prototype.hasOwnProperty.call(patch, "provider")) sharedPatch.provider = next.provider;
        if (Object.prototype.hasOwnProperty.call(patch, "service")) sharedPatch.service = next.service;
        if (Object.prototype.hasOwnProperty.call(patch, "region")) sharedPatch.region = next.region;
        if (Object.keys(sharedPatch).length > 0) onFilterChange(sharedPatch);
      }
      return next;
    });
  }, [onFilterChange]);

  const handleFilterReset = useCallback(() => {
    const resetState: SpendAnalyticsFilters = { ...defaultSpendAnalyticsFilters };
    setFilters(resetState);
    if (onFilterChange) {
      onFilterChange({
        provider: resetState.provider,
        service: resetState.service,
        region: resetState.region,
      });
    }
  }, [onFilterChange]);

  if (!api || !caps || !caps.modules?.["costAnalysis"]?.enabled) return null;

  if (loading && !apiData) {
    return <SectionLoading label="Analyzing Cost Analysis..." />;
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-10 md:py-20 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-dashed border-slate-200 px-4 text-center">
        <AlertCircle className="text-rose-500 mb-4 w-8 h-8 md:w-10 md:h-10" />
        <p className="text-slate-900 font-black tracking-tight text-sm md:text-base">{error}</p>
      </div>
    );
  }

  return (
    <CostAnalysisView
      filters={filters}
      onFiltersChange={handleFilterChange}
      onResetFilters={handleFilterReset}
      filterOptions={filterOptions}
      spendAnalytics={spendAnalytics}
      message={apiData?.message || ""}
      isLoading={isRefreshing}
    />
  );
};

export default CostAnalysis;



