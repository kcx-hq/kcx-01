import { useEffect, useRef, useState } from "react";
import type { ApiClient, Capabilities } from "../../../../services/apiClient";
import type {
  ApiLikeError,
  DataQualityApiPayload,
  DataQualityFilters,
  UseClientCDataQualityDataResult,
} from "../types";

export const useClientCDataQualityData = (
  api: ApiClient | null,
  caps: Capabilities | null,
  debouncedFilters: DataQualityFilters = {},
  forceRefreshKey = 0,
): UseClientCDataQualityDataResult => {
  const [qualityData, setQualityData] = useState<DataQualityApiPayload>(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const fetchData = async (): Promise<void> => {
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
          caps?.modules?.["dataQuality"]?.enabled &&
          caps?.modules?.["dataQuality"]?.endpoints?.["analysis"];

        if (!endpointDef) return;

        const params: Partial<DataQualityFilters> = {};
        if (debouncedFilters?.provider && debouncedFilters.provider !== "All")
          params.provider = debouncedFilters.provider;
        if (debouncedFilters?.service && debouncedFilters.service !== "All")
          params.service = debouncedFilters.service;
        if (debouncedFilters?.region && debouncedFilters.region !== "All")
          params.region = debouncedFilters.region;
        if (debouncedFilters?.uploadId)
          params.uploadId = debouncedFilters.uploadId;

        // Use capabilities API
        let payload: DataQualityApiPayload | null = null;

        try {
          payload = await api.call<DataQualityApiPayload>("dataQuality", "analysis", {
            params,
          });
        } catch (callError: unknown) {
          console.error("Data Quality API call failed:", callError);
          throw callError;
        }

        if (!abortControllerRef.current?.signal.aborted) {
          setQualityData(payload || null);
          setError(null);
          prevFiltersRef.current = { ...debouncedFilters };
        }
      } catch (caughtError: unknown) {
        const typedError = caughtError as ApiLikeError;
        if (typedError?.code !== "NOT_SUPPORTED") {
          if (typedError?.name !== "AbortError" && !abortControllerRef.current?.signal.aborted) {
            console.error("Error fetching data quality data:", caughtError);
            setError(typedError.message || "Failed to load data quality data");
          }
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
          setIsFiltering(false);
        }
      }
    };

    void fetchData();

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
    // forceRefreshKey triggers fetch even if filters stayed same (reset)
    // Also trigger on api/caps changes
  }, [api, caps, debouncedFilters, forceRefreshKey]);

  return { qualityData, loading, isFiltering, error };
};
