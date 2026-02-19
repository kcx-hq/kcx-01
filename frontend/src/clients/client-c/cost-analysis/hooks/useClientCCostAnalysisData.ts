import { useEffect, useRef, useState } from "react";

/**
 * Fetches client-c cost analysis payload from backend.
 * - Shows full loader only for initial load or page changes
 * - Shows subtle "isFiltering" when backend filters change
 */
export const useClientCCostAnalysisData = (api, caps, debouncedFilters, forceRefreshKey) => {
  const [costAnalysisData, setCostAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);



  const abortControllerRef = useRef(null);
  const prevFiltersRef = useRef(debouncedFilters);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!api || !caps) {
      console.warn('⚠️ useClientCCostAnalysisData: Missing api or caps');
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const filtersChanged =
      JSON.stringify(prevFiltersRef.current) !== JSON.stringify(debouncedFilters);

    const isFilterChange = filtersChanged && !isInitialMount.current;

    console.log('🔄 Cost Analysis Data Hook Triggered:', {
      isInitialMount: isInitialMount.current,
      filtersChanged,
      isFilterChange,
      currentFilters: debouncedFilters,
      previousFilters: prevFiltersRef.current
    });

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
        // Development logging
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Fetching cost analysis with filters:', debouncedFilters);
        }
        
        const endpointDef =
          caps?.modules?.costAnalysis?.enabled &&
          caps?.modules?.costAnalysis?.endpoints?.getCostAnalysis;

        if (!endpointDef) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Cost Analysis endpoint not defined in capabilities');
          }
          return;
        }

        // Prepare parameters to send
        const params = {
          groupBy: debouncedFilters?.groupBy || 'ServiceName'
        };
        
        // Pass uploadId from filters to match core-dashboard pattern
        if (debouncedFilters?.uploadId) {
          params.uploadId = debouncedFilters.uploadId;
        }
        
        if (debouncedFilters?.provider && debouncedFilters.provider !== "All")
          params.provider = debouncedFilters.provider;
        if (debouncedFilters?.service && debouncedFilters.service !== "All")
          params.service = debouncedFilters.service;
        if (debouncedFilters?.region && debouncedFilters.region !== "All")
          params.region = debouncedFilters.region;

        console.log('📡 Making API call to getCostAnalysis with params:', params);

        // Use capabilities API - endpoint key is "getCostAnalysis"
        const res = await api.call("costAnalysis", "getCostAnalysis", { 
          params
        });
        
        console.log('✅ Cost analysis API response:', res);
        
        // ✅ unwrap { success, data }
        const payload = res?.data;
        const data = payload?.data ?? payload;

        console.log('📦 Final unwrapped data:', {
          hasData: !!data,
          dataKeys: data ? Object.keys(data) : [],
          totalSpend: data?.kpis?.totalSpend,
          chartDataLength: data?.chartData?.length,
          breakdownLength: data?.breakdown?.length
        });

        if (!abortControllerRef.current?.signal.aborted) {
          setCostAnalysisData(data || null);
          setError(null);
          prevFiltersRef.current = { ...debouncedFilters };
          console.log('✅ Cost analysis data updated successfully');
        }
      } catch (error) {
        if (error?.code !== "NOT_SUPPORTED") {
          if (error?.name !== "AbortError" && !abortControllerRef.current?.signal.aborted) {
            console.error('Error fetching cost analysis data:', error);
            setError(error.message || 'Failed to load cost analysis data');
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

  return { costAnalysisData, loading, isFiltering, error };
};