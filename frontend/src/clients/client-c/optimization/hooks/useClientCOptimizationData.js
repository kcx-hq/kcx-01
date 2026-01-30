import { useEffect, useRef, useState } from "react";

export const useClientCOptimizationData = (api, caps, debouncedFilters, forceRefreshKey) => {
  const [optimizationData, setOptimizationData] = useState(null);
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

        console.log("fetching")
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
          caps?.modules?.optimization?.enabled &&
          caps?.modules?.optimization?.endpoints?.opportunities;

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

        // Fetch optimization data with available endpoints from capabilities map
        const mod = caps?.modules?.optimization;
        const enabled = !!mod?.enabled;

        const canRec = enabled && !!mod?.endpoints?.recommendations;
        const canOpp = enabled && !!mod?.endpoints?.opportunities;

        // Only call the endpoints that are actually defined in capabilities
        const [recRes, oppRes] = await Promise.all([
          canRec ? api.call("optimization", "recommendations", { params }) : Promise.resolve(null),
          canOpp ? api.call("optimization", "opportunities", { params }) : Promise.resolve(null)
        ]);


        console.log('Recommendations response:', recRes);
        console.log('Opportunities response:', oppRes);
        if (abortControllerRef.current?.signal.aborted) return;

        const recData = recRes?.data ?? null;
        const oppData = oppRes?.data ?? null;

        // Process data from both endpoints
        let recommendations = [];
        let opportunities = [];
        let idleResources = [];
        let rightSizingRecs = [];
        
        // Process recommendations data from recommendations endpoint
        if (Array.isArray(recData)) {
          // Store all recommendations data as-is
          recommendations = recData.map(item => ({
            ...item,
            source: 'recommendations'
          }));
          
          // Categorize recommendations by type
          recData.forEach(item => {
            if (item.type === 'idle_resource' || item.category === 'idle_resources') {
              idleResources.push({...item, source: 'recommendations'});
            } else if (item.type === 'right_sizing' || item.category === 'rightsizing') {
              rightSizingRecs.push({...item, source: 'recommendations'});
            } else if (item.type === 'opportunity' || item.category === 'cost_saving') {
              // If recommendations endpoint also has opportunities, add to opportunities
              opportunities.push({...item, source: 'recommendations'});
            }
          });
        }
        
        // Process opportunities data from opportunities endpoint
        if (Array.isArray(oppData)) {
          // Add opportunities data
          opportunities = [...opportunities, ...oppData.map(item => ({
            ...item,
            source: 'opportunities'
          }))];
        }

        const payload = {
          opportunities,
          recommendations,
          idleResources,
          rightSizingRecs,
          totalPotentialSavings: opportunities.reduce((sum, opp) => sum + (opp.savings || 0), 0),
        };

        console.log(payload)

        if (!abortControllerRef.current?.signal.aborted) {
          setOptimizationData(payload);
          setError(null);
          prevFiltersRef.current = { ...debouncedFilters };
        }
      } catch (error) {
        if (error?.code !== "NOT_SUPPORTED") {
          if (error?.name !== "AbortError" && !abortControllerRef.current?.signal.aborted) {
            console.error("Error fetching optimization data:", error);
            setError(error.message || 'Failed to load optimization data');
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

  return { optimizationData, loading, isFiltering, error };
};