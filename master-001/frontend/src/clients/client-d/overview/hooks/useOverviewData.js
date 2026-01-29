import { useEffect, useRef, useState } from "react";

export const useOverviewData = (api, caps, debouncedFilters, forceRefreshKey) => {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const abortControllerRef = useRef(null);
  const prevFiltersRef = useRef(debouncedFilters);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!api || !caps) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const filtersChanged =
      JSON.stringify(prevFiltersRef.current) !== JSON.stringify(debouncedFilters);

    const isFilterChange = filtersChanged && !isInitialMount.current;

    const fetchData = async () => {
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
          caps?.modules?.overview?.enabled &&
          caps?.modules?.overview?.endpoints?.overview;

        if (!endpointDef) return;

        const params = {};
        if (debouncedFilters?.provider && debouncedFilters.provider !== "All")
          params.provider = debouncedFilters.provider;
        if (debouncedFilters?.service && debouncedFilters.service !== "All")
          params.service = debouncedFilters.service;
        if (debouncedFilters?.region && debouncedFilters.region !== "All")
          params.region = debouncedFilters.region;

        const res = await api.call("overview", "overview", { params });

        // ✅ unwrap { success, data }
        const payload = res?.data;
        const data = payload?.data ?? payload;

        if (!abortControllerRef.current?.signal.aborted && data) {
          setOverviewData(data);
          prevFiltersRef.current = { ...debouncedFilters };
        }
      } catch (error) {
        if (error?.code !== "NOT_SUPPORTED") {
          if (error?.name !== "AbortError" && !abortControllerRef.current?.signal.aborted) {
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

    return () => abortControllerRef.current?.abort();
  }, [api, caps, debouncedFilters, forceRefreshKey]);

  return { overviewData, loading, isFiltering };
};
