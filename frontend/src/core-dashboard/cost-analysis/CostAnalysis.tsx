import React, { useCallback, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { SectionLoading } from "../common/SectionStates";
import CostAnalysisView from "./CostAnalysisView";
import { useCostFilters } from "./hooks/useCostFilters";
import { useCostAnalysis } from "./hooks/useCostAnalysis";
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
  api: CostAnalysisApiClient | null | undefined;
  caps: CostAnalysisCaps | null | undefined;
}

const getSpendAnalytics = (data: CostAnalysisApiData | null): SpendAnalyticsPayload | null => {
  if (!data?.spendAnalytics) return null;
  return data.spendAnalytics;
};

const CostAnalysis = ({ api, caps }: CostAnalysisProps) => {
  const [filters, setFilters] = useState<SpendAnalyticsFilters>(defaultSpendAnalyticsFilters);

  const { filterOptions } = useCostFilters({ api, caps });
  const { loading, isRefreshing, apiData, error } = useCostAnalysis({
    api,
    caps,
    filters,
  });

  const spendAnalytics = useMemo<SpendAnalyticsPayload | null>(
    () => getSpendAnalytics(apiData),
    [apiData]
  );

  const handleFilterChange = useCallback((patch: SpendAnalyticsFilterPatch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters(defaultSpendAnalyticsFilters);
  }, []);

  if (!api || !caps || !caps.modules?.["costAnalysis"]?.enabled) return null;

  if (loading && !apiData) {
    return <SectionLoading label="Loading Spend Analytics..." />;
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



