import { useEffect, useRef, useState } from "react";
import { useDashboardStore } from "../../../store/Dashboard.store";

export function useCostAnalysis({ api, caps, filters, groupBy }) {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);

  const prevFiltersRef = useRef(filters);
  const prevGroupByRef = useRef(groupBy);
  const prevUploadIdsRef = useRef((useDashboardStore.getState().uploadIds || []).join(","));
  const abortControllerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Subscribe to uploads selection so we re-run queries when selection changes
  const uploadIds = useDashboardStore((s) => s.uploadIds);
  const uploadIdsKey = (Array.isArray(uploadIds) ? uploadIds.join(",") : "") || ""; 

  useEffect(() => {
    const filtersChanged =
      prevFiltersRef.current.provider !== filters.provider ||
      prevFiltersRef.current.service !== filters.service ||
      prevFiltersRef.current.region !== filters.region;

    const uploadChanged = prevUploadIdsRef.current !== uploadIdsKey;

    const groupByChanged = prevGroupByRef.current !== groupBy;

    // Re-run when filters, groupBy or upload selection changes (or on initial load)
    if (!isInitialLoadRef.current && !filtersChanged && !groupByChanged && !uploadChanged) return; 

    if (abortControllerRef.current) abortControllerRef.current.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const run = async () => {
      if (isInitialLoadRef.current) setLoading(true);
      else setIsRefreshing(true);

      try {
        if (!api || !caps) return;

        const params = {
          provider: filters.provider !== "All" ? filters.provider : undefined,
          service: filters.service !== "All" ? filters.service : undefined,
          region: filters.region !== "All" ? filters.region : undefined,
          groupBy,
        };

        const res = await api.call("costAnalysis", "costAnalysis", { params });
        if (abortController.signal.aborted) return;

        const payload = res?.data ?? res;
        setApiData(payload);
        setError(null);

        prevFiltersRef.current = { ...filters };
        prevGroupByRef.current = groupBy;
        prevUploadIdsRef.current = uploadIdsKey;
        isInitialLoadRef.current = false;
      } catch (e) {
        if (e?.code === "NOT_SUPPORTED") return;
        if (e?.name !== "AbortError" && !abortController.signal.aborted) {
          setError("Failed to load data.");
          console.error("Cost analysis fetch error:", e);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
          setIsRefreshing(false);
          if (isInitialLoadRef.current) isInitialLoadRef.current = false;
        }
      }
    };

    run();

    prevFiltersRef.current = { ...filters };
    prevGroupByRef.current = groupBy;

    return () => abortController.abort();
  }, [api, caps, filters, groupBy, uploadIdsKey]);

  return { loading, isRefreshing, apiData, error };
}
