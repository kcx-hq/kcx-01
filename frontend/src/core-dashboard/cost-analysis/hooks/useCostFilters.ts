import { useEffect, useState } from "react";
import { useDashboardStore } from "../../../store/Dashboard.store";
import {
  CostAnalysisApiClient,
  CostAnalysisCaps,
  CostAnalysisFilterOptions,
  defaultCostAnalysisFilterOptions,
  isObjectRecord,
} from "../types";

interface UseCostFiltersArgs {
  api: CostAnalysisApiClient | null | undefined;
  caps: CostAnalysisCaps | null | undefined;
}

interface UseCostFiltersResult {
  filterOptions: CostAnalysisFilterOptions;
}

const getPayload = (response: unknown): CostAnalysisFilterOptions | null => {
  if (!isObjectRecord(response)) return null;
  return response as CostAnalysisFilterOptions;
};

const hasNotSupportedCode = (error: unknown): boolean =>
  isObjectRecord(error) && error.code === "NOT_SUPPORTED";

export function useCostFilters({ api, caps }: UseCostFiltersArgs): UseCostFiltersResult {
  const [filterOptions, setFilterOptions] = useState<CostAnalysisFilterOptions>(
    defaultCostAnalysisFilterOptions
  );

  const uploadIds = useDashboardStore((state) => state.uploadIds);
  const uploadIdsKey = (Array.isArray(uploadIds) ? uploadIds.join(",") : "") || "";

  useEffect(() => {
    if (!api || !caps) return;

    let mounted = true;

    const fetchFilters = async (): Promise<void> => {
      try {
        const response = await api.call("costAnalysis", "costFilters");
        const payload = getPayload(response);
        if (mounted && payload) {
          setFilterOptions({
            ...defaultCostAnalysisFilterOptions,
            ...payload,
          });
        }
      } catch (fetchError: unknown) {
        if (!hasNotSupportedCode(fetchError)) {
          console.error("Failed to fetch filter options:", fetchError);
        }
      }
    };

    void fetchFilters();

    return () => {
      mounted = false;
    };
  }, [api, caps, uploadIdsKey]);

  return { filterOptions };
}



