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

const normalizeAllFirst = (values: unknown): string[] => {
  if (!Array.isArray(values)) return ["All"];
  const cleaned = values
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  const withoutAll = cleaned.filter((item) => item.toLowerCase() !== "all");
  const deduped = Array.from(new Set(withoutAll));
  return ["All", ...deduped];
};

const getPayload = (response: unknown): CostAnalysisFilterOptions | null => {
  if (!isObjectRecord(response)) return null;
  return {
    providers: normalizeAllFirst(response["providers"]),
    services: normalizeAllFirst(response["services"]),
    regions: normalizeAllFirst(response["regions"]),
    accounts: normalizeAllFirst(response["accounts"]),
    subAccounts: normalizeAllFirst(response["subAccounts"]),
    costCategories: normalizeAllFirst(response["costCategories"]),
    apps: normalizeAllFirst(response["apps"]),
    teams: normalizeAllFirst(response["teams"]),
    envs: normalizeAllFirst(response["envs"]),
    currencyModes: Array.isArray(response["currencyModes"])
      ? response["currencyModes"].filter((item): item is "usd" => item === "usd")
      : defaultCostAnalysisFilterOptions.currencyModes,
    tagKeys: Array.isArray(response["tagKeys"])
      ? response["tagKeys"].filter((item): item is string => typeof item === "string")
      : [],
  };
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



