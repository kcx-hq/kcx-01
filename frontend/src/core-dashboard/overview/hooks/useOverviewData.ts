import { useEffect, useRef, useState } from "react";
import {
  isObjectRecord,
  OverviewApiClient,
  OverviewApiData,
  OverviewCaps,
  OverviewFilters,
} from "../types";

interface UseOverviewDataResult {
  overviewData: OverviewApiData | null;
  loading: boolean;
  isFiltering: boolean;
}

const getOverviewPayload = (response: unknown): OverviewApiData | null => {
  if (!isObjectRecord(response)) return null;
  return response as OverviewApiData;
};

const hasNotSupportedCode = (error: unknown): boolean =>
  isObjectRecord(error) && error.code === "NOT_SUPPORTED";

const isAbortError = (error: unknown): boolean =>
  isObjectRecord(error) && error.name === "AbortError";

export const useOverviewData = (
  api: OverviewApiClient | null | undefined,
  caps: OverviewCaps | null | undefined,
  debouncedFilters: OverviewFilters,
  forceRefreshKey: number
): UseOverviewDataResult => {
  const [overviewData, setOverviewData] = useState<OverviewApiData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef<OverviewFilters>(debouncedFilters);
  const isInitialMount = useRef<boolean>(true);

  useEffect(() => {
    if (!api || !caps) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const filtersChanged =
      JSON.stringify(prevFiltersRef.current) !== JSON.stringify(debouncedFilters);
    const isFilterChange = filtersChanged && !isInitialMount.current;

    const fetchData = async (): Promise<void> => {
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
          caps.modules?.overview?.enabled &&
          caps.modules?.overview?.endpoints?.overview;
        if (!endpointDef) return;

        const params: Record<string, string | undefined> = {
          provider:
            debouncedFilters.provider && debouncedFilters.provider !== "All"
              ? debouncedFilters.provider
              : undefined,
          service:
            debouncedFilters.service && debouncedFilters.service !== "All"
              ? debouncedFilters.service
              : undefined,
          region:
            debouncedFilters.region && debouncedFilters.region !== "All"
              ? debouncedFilters.region
              : undefined,
        };

        const response = await api.call("overview", "overview", { params });
        const payload = getOverviewPayload(response);

        if (!abortControllerRef.current?.signal.aborted && payload) {
          setOverviewData(payload);
          prevFiltersRef.current = { ...debouncedFilters };
        }
      } catch (error: unknown) {
        if (!hasNotSupportedCode(error) && !isAbortError(error) && !abortControllerRef.current?.signal.aborted) {
          console.error("Error fetching overview data:", error);
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
  }, [api, caps, debouncedFilters, forceRefreshKey]);

  return { overviewData, loading, isFiltering };
};

