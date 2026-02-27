import { useEffect, useRef, useState } from "react";
import type { ApiClient, Capabilities } from "../../../../services/apiClient";
import type {
  ApiLikeError,
  ClientCApiCallOptions,
  OverviewData,
  OverviewFilters,
  UseOverviewDataResult,
} from "../types";

export const useOverviewData = (
  api: ApiClient | null,
  caps: Capabilities | null,
  debouncedFilters: OverviewFilters,
  forceRefreshKey: number,
): UseOverviewDataResult => {
  const [overviewData, setOverviewData] = useState<UseOverviewDataResult["overviewData"]>(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef(debouncedFilters);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!api || !caps) return;

    // Cancel previous request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const filtersChanged =
      JSON.stringify(prevFiltersRef.current) !== JSON.stringify(debouncedFilters);

    const isFilterChange = filtersChanged && !isInitialMount.current;

    const fetchData = async () => {
      // Loading behavior
      if (isInitialMount.current) {
        setLoading(true);
        isInitialMount.current = false;
      } else if (isFilterChange) {
        setIsFiltering(true);
      } else {
        setLoading(true);
      }

      try {
        const endpointDef =
          caps?.modules?.["overview"]?.enabled &&
          caps?.modules?.["overview"]?.endpoints?.["overview"];

        if (!endpointDef) return;

        const params: Record<string, string> = {};
        if (debouncedFilters?.provider && debouncedFilters.provider !== "All")
          params["provider"] = debouncedFilters.provider;
        if (debouncedFilters?.service && debouncedFilters.service !== "All")
          params["service"] = debouncedFilters.service;
        if (debouncedFilters?.region && debouncedFilters.region !== "All")
          params["region"] = debouncedFilters.region;

        const options: ClientCApiCallOptions = { params };
        if (abortControllerRef.current?.signal) {
          options.signal = abortControllerRef.current.signal;
        }
        const response = await api.call<OverviewData | { data?: OverviewData }>("overview", "overview", options);
        const payload = (
          response && typeof response === "object" && "totalSpend" in response
            ? response
            : response?.data
        ) as OverviewData | undefined;

        if (!abortControllerRef.current?.signal.aborted && payload) {
          setOverviewData(payload);
          prevFiltersRef.current = { ...debouncedFilters };
        }
      } catch (error: unknown) {
        const apiError = error as ApiLikeError;
        if (apiError?.code !== "NOT_SUPPORTED") {
          if (apiError?.name !== "AbortError" && !abortControllerRef.current?.signal.aborted) {
            console.error("Error fetching overview data:", error);
          }
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
          setIsFiltering(false);
        }
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
    // forceRefreshKey triggers fetch even if filters stayed same (reset)
  }, [api, caps, debouncedFilters, forceRefreshKey]);

  return { overviewData, loading, isFiltering };
};
