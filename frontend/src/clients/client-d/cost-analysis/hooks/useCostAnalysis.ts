import { useEffect, useRef, useState } from "react";
import type { ApiLikeError, CostAnalysisApiData, UseCostAnalysisParams, UseCostAnalysisResult } from "../types";

export function useCostAnalysis({
  api,
  caps,
  filters,
  groupBy,
}: UseCostAnalysisParams): UseCostAnalysisResult {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiData, setApiData] = useState<CostAnalysisApiData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prevFiltersRef = useRef(filters);
  const prevGroupByRef = useRef(groupBy);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const filtersChanged =
      prevFiltersRef.current.provider !== filters.provider ||
      prevFiltersRef.current.service !== filters.service ||
      prevFiltersRef.current.region !== filters.region;

    const groupByChanged = prevGroupByRef.current !== groupBy;

    if (!isInitialLoadRef.current && !filtersChanged && !groupByChanged) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const run = async () => {
      if (isInitialLoadRef.current) setLoading(true);
      else setIsRefreshing(true);

      try {
        if (!api || !caps) return;

        const params: Record<string, string | undefined> = {
          provider: filters.provider !== "All" ? filters.provider : undefined,
          service: filters.service !== "All" ? filters.service : undefined,
          region: filters.region !== "All" ? filters.region : undefined,
          groupBy,
        };

        const res = await api.call<unknown>("costAnalytics", "costAnalysis", { params });
        if (abortController.signal.aborted) return;

        const payload = res as CostAnalysisApiData | null | undefined;
        setApiData((payload as CostAnalysisApiData | null) ?? null);
        setError(null);

        prevFiltersRef.current = { ...filters };
        prevGroupByRef.current = groupBy;
        isInitialLoadRef.current = false;
      } catch (e: unknown) {
        const err = e as ApiLikeError;
        if (err?.code === "NOT_SUPPORTED") return;
        if (err?.name !== "AbortError" && !abortController.signal.aborted) {
          setError("Failed to load data.");
          console.error("Cost analysis fetch error:", err);
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
  }, [api, caps, filters, groupBy]);

  return { loading, isRefreshing, apiData, error };
}
