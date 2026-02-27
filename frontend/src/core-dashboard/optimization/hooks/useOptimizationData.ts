import { useCallback, useEffect, useRef, useState } from "react";
import { buildParamsFromFilters } from "../utils/helpers";
import type {
  ApiLikeError,
  IdleResource,
  OptimizationData,
  OptimizationFilters,
  Opportunity,
  RightSizingRecommendation,
  UseOptimizationDataParams,
  UseOptimizationDataResult,
} from "../types";

export function useOptimizationData({
  api,
  caps,
  parentFilters,
}: UseOptimizationDataParams): UseOptimizationDataResult {
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialMount = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef<OptimizationFilters>({});

  const fetchOptimizationData = useCallback(async () => {
    if (!api || !caps) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    if (isInitialMount.current) setLoading(true);
    else setIsRefreshing(true);

    setError(null);

    try {
      const params = buildParamsFromFilters(parentFilters);

      const mod = caps?.modules?.optimization;
      const canActionCenter = !!mod?.enabled && !!mod?.endpoints?.actionCenter;
      if (!canActionCenter) {
        setOptimizationData(null);
        setError("Optimization action-center endpoint is not enabled.");
        return;
      }

      const actionCenterRes = await api.call<unknown>("optimization", "actionCenter", { params });
      if (abortControllerRef.current?.signal.aborted) return;

      const payload = (actionCenterRes && typeof actionCenterRes === "object"
        ? actionCenterRes
        : {}) as Record<string, unknown>;
      const model = payload?.model ?? null;
      const opportunities = Array.isArray(payload?.opportunities) ? payload.opportunities : [];
      const idleResources = Array.isArray(payload?.idleResources) ? payload.idleResources : [];
      const rightSizingRecs = Array.isArray(payload?.rightSizingRecommendations)
        ? payload.rightSizingRecommendations
        : [];
      const trackerItems = Array.isArray(payload?.trackerItems) ? payload.trackerItems : [];
      const commitmentGap =
        payload?.commitmentGap && typeof payload.commitmentGap === "object"
          ? payload.commitmentGap
          : null;

      setOptimizationData({
        opportunities,
        idleResources,
        rightSizingRecs,
        commitmentGap,
        trackerItems,
        actionCenterModel: model,
        totalPotentialSavings: opportunities.reduce((sum, opp) => sum + (opp.savings || 0), 0),
      });
    } catch (err: unknown) {
      const errorObj = err as ApiLikeError;
      if (errorObj?.code !== "NOT_SUPPORTED" && errorObj?.name !== "AbortError") {
        console.error("Error fetching optimization data:", errorObj);
        setError("Failed to load optimization data");
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
        setIsRefreshing(false);
        if (isInitialMount.current) isInitialMount.current = false;
        prevFiltersRef.current = { ...parentFilters };
      }
    }
  }, [api, caps, parentFilters]);

  useEffect(() => {
    if (!api || !caps) return;

    const filtersChanged =
      prevFiltersRef.current.provider !== parentFilters.provider ||
      prevFiltersRef.current.service !== parentFilters.service ||
      prevFiltersRef.current.region !== parentFilters.region;

    if (!isInitialMount.current && !filtersChanged) return;

    fetchOptimizationData();

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [api, caps, parentFilters, fetchOptimizationData]);

  return {
    optimizationData,
    loading,
    error,
    isRefreshing,
    refetch: fetchOptimizationData,
  };
}



