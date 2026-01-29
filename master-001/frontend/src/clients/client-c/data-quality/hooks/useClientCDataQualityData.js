import { useEffect, useRef, useState } from "react";

export const useClientCDataQualityData = (api, caps, debouncedFilters, forceRefreshKey) => {
  const [qualityData, setQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);

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
          caps?.modules?.dataQuality?.enabled &&
          caps?.modules?.dataQuality?.endpoints?.analysis;

        if (!endpointDef) return;

        const params = {};
        if (debouncedFilters?.provider && debouncedFilters.provider !== "All")
          params.provider = debouncedFilters.provider;
        if (debouncedFilters?.service && debouncedFilters.service !== "All")
          params.service = debouncedFilters.service;
        if (debouncedFilters?.region && debouncedFilters.region !== "All")
          params.region = debouncedFilters.region;
        if (debouncedFilters?.uploadId)
          params.uploadId = debouncedFilters.uploadId;

        // Use capabilities API
        let res;
        
        try {
          res = await api.call("dataQuality", "analysis", { 
            params
          });
        } catch (error) {
          console.error('🔍 Data Quality API call failed:', error);
          throw error;
        }
        
        const payload = res?.data || res;
        
        
        if (!abortControllerRef.current?.signal.aborted) {
          setQualityData(payload || null);
          setError(null);
          prevFiltersRef.current = { ...debouncedFilters };
        }
      } catch (error) {
        if (error?.code !== "NOT_SUPPORTED") {
          if (error?.name !== "AbortError" && !abortControllerRef.current?.signal.aborted) {
            console.error("Error fetching data quality data:", error);
            setError(error.message || 'Failed to load data quality data');
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
    // Also trigger on api/caps changes
  }, [api, caps, debouncedFilters, forceRefreshKey]);

  return { qualityData, loading, isFiltering, error };
};