import { useEffect, useState } from "react";
import type { ApiLikeError, CostFilterOptions, UseCostFiltersParams, UseCostFiltersResult } from "../types";

export function useCostFilters({ api, caps }: UseCostFiltersParams): UseCostFiltersResult {
  const [filterOptions, setFilterOptions] = useState<CostFilterOptions>({});

  useEffect(() => {
    if (!api || !caps) return;

    let mounted = true;

    const fetchFilters = async () => {
      try {
        const payload = (await api.call<unknown>("costAnalytics", "costFilters")) as
          | CostFilterOptions
          | null
          | undefined;
        if (mounted && payload) setFilterOptions(payload as CostFilterOptions);
      } catch (e: unknown) {
        const err = e as ApiLikeError;
        if (err?.code !== "NOT_SUPPORTED") {
          console.error("Failed to fetch filter options:", err);
        }
      }
    };

    fetchFilters();
    return () => {
      mounted = false;
    };
  }, [api, caps]);

  return { filterOptions };
}
