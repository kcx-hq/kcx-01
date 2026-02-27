import { useEffect, useRef, useState } from "react";
import type { ApiClient, Capabilities } from "../../../../services/apiClient";
import type {
  ApiLikeError,
  CostAlertsApiData,
  CostAlertsFilters,
  UseClientCCostAlertsDataResult,
} from "../types";

export const useClientCCostAlertsData = (
  api: ApiClient | null,
  caps: Capabilities | null,
  debouncedFilters: CostAlertsFilters,
  forceRefreshKey: number,
): UseClientCCostAlertsDataResult => {
  const [alertsData, setAlertsData] = useState<CostAlertsApiData | null>(null);
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
        // Check if endpoints are available
        const hasAlertsEndpoint = 
          caps?.modules?.["costAlerts"]?.enabled &&
          caps?.modules?.["costAlerts"]?.endpoints?.["alerts"];

        const hasBudgetStatusEndpoint = 
          caps?.modules?.["costAlerts"]?.enabled &&
          caps?.modules?.["costAlerts"]?.endpoints?.["budgetStatus"];

        if (!hasAlertsEndpoint && !hasBudgetStatusEndpoint) {
          setError('No cost alerts endpoints available');
          return;
        }

        // Prepare filter parameters
        const params: Partial<CostAlertsFilters> = {};
        if (debouncedFilters?.provider && debouncedFilters.provider !== "All")
          params.provider = debouncedFilters.provider;
        if (debouncedFilters?.service && debouncedFilters.service !== "All")
          params.service = debouncedFilters.service;
        if (debouncedFilters?.region && debouncedFilters.region !== "All")
          params.region = debouncedFilters.region;
        if (debouncedFilters?.status && debouncedFilters.status !== "All")
          params.status = debouncedFilters.status;
        if (debouncedFilters?.severity && debouncedFilters.severity !== "All")
          params.severity = debouncedFilters.severity;
        if (debouncedFilters?.uploadId)
          params.uploadId = debouncedFilters.uploadId;

        // Fetch all required data endpoints
        const [alertsRes, budgetStatusRes] = await Promise.all([
          hasAlertsEndpoint 
            ? api.call("costAlerts", "alerts", { params })
            : null,
          hasBudgetStatusEndpoint 
            ? api.call("costAlerts", "budget-Status", { params })
            : null
        ]);

         console.log("alerts : ",alertsRes)
        // Process responses
        const alertsData = alertsRes || null;
        const budgetStatusData = budgetStatusRes || null;

        if (!abortControllerRef.current?.signal.aborted) {
          setAlertsData({
            alerts: alertsData,
            budgetStatus: budgetStatusData
          });
          setError(null);
          prevFiltersRef.current = { ...debouncedFilters };
        }
      } catch (error: unknown) {
        const typedError = error as ApiLikeError;
        if (typedError?.code !== "NOT_SUPPORTED") {
          if (typedError?.name !== "AbortError" && !abortControllerRef.current?.signal.aborted) {
            console.error("Error fetching cost alerts data:", error);
            setError(typedError.message || 'Failed to load cost alerts data');
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

  return { alertsData, loading, isFiltering, error };
};
