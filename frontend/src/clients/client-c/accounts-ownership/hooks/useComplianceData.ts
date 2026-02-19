import { useEffect, useRef, useState } from "react";

export const useComplianceData = (api, caps, debouncedFilters, forceRefreshKey) => {
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const abortControllerRef = useRef(null);
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
          caps?.modules?.governance?.enabled &&
          caps?.modules?.governance?.endpoints?.compliance;

        if (!endpointDef) return;

        const params = {};
        if (debouncedFilters?.provider && debouncedFilters.provider !== "All")
          params.provider = debouncedFilters.provider;
        if (debouncedFilters?.service && debouncedFilters.service !== "All")
          params.service = debouncedFilters.service;
        if (debouncedFilters?.region && debouncedFilters.region !== "All")
          params.region = debouncedFilters.region;

        const res = await api.call("governance", "compliance", { params });
        console.log(res)
        const payload = res?.data;

        if (!abortControllerRef.current?.signal.aborted && payload) {
          setComplianceData(payload);
          prevFiltersRef.current = { ...debouncedFilters };
        }
      } catch (error) {
        if (error?.code !== "NOT_SUPPORTED") {
          if (error?.name !== "AbortError" && !abortControllerRef.current?.signal.aborted) {
            console.error("Error fetching compliance data:", error);
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

  return { complianceData, loading, isFiltering };
};