import { useCallback, useEffect, useRef, useState } from "react";
import { buildParamsFromFilters } from "../utils/helpers";
import type {
  ApiLikeError,
  OptimizationDataExtended,
  OptimizationIdlePayload,
  OptimizationModuleCaps,
  OptimizationRightSizingPayload,
  OptimizationSummaryPayload,
  Opportunity,
  RecommendationRaw,
  UseOptimizationDataParams,
  UseOptimizationDataResult,
} from "../types";

/**
 * Client-D API Shapes:
 * - summary: { summary, recommendations, byCategory }
 * - idleResources: { idleResources, summary }
 * - rightSizing: { recommendations, summary }
 * - commitments: commitment object (onDemandPercentage, potentialSavings, pricing...)
 */
export function useOptimizationData({
  api,
  caps,
  parentFilters,
}: UseOptimizationDataParams): UseOptimizationDataResult {
  const [optimizationData, setOptimizationData] = useState<OptimizationDataExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialMount = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef(parentFilters);

  const fetchOptimizationData = useCallback(async () => {
    if (!api || !caps) return;
    if (!caps.modules?.["optimization"]?.enabled) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    if (isInitialMount.current) setLoading(true);
    else setIsRefreshing(true);

    setError(null);

    try {
      const params = buildParamsFromFilters(parentFilters);

      const mod = caps?.modules?.["optimization"] as OptimizationModuleCaps | undefined;
      const enabled = !!mod?.enabled;

      // ✅ Client-D endpoints (update these keys to match your api config names)
      const canSummary = enabled && !!mod?.endpoints?.summary;
      const canIdle = enabled && !!mod?.endpoints?.idleResources;
      const canRight = enabled && !!mod?.endpoints?.rightSizing;
      const canCommit = enabled && !!mod?.endpoints?.commitments;

      const [summaryRes, idleRes, rightRes, commitRes] = await Promise.all([
        canSummary ? api.call("optimization", "summary", { params }) : Promise.resolve(null),
        canIdle ? api.call("optimization", "idleResources", { params }) : Promise.resolve(null),
        canRight ? api.call("optimization", "rightSizing", { params }) : Promise.resolve(null),
        canCommit ? api.call("optimization", "commitments", { params }) : Promise.resolve(null),
      ]);

      if (abortControllerRef.current?.signal.aborted) return;

      const summaryPayload = (summaryRes as OptimizationSummaryPayload | null) ?? null;
      const idlePayload = (idleRes as OptimizationIdlePayload | null) ?? null;
      const rightPayload = (rightRes as OptimizationRightSizingPayload | null) ?? null;
      const commitPayload = (commitRes as Record<string, unknown> | null) ?? null;

      // normalize
      const summary = summaryPayload?.summary || null;
      const allRecommendations = Array.isArray(summaryPayload?.recommendations)
        ? summaryPayload.recommendations
        : [];

      const byCategory = summaryPayload?.byCategory || {};

      const idleResources = Array.isArray(idlePayload?.idleResources)
        ? idlePayload.idleResources
        : [];

      const idleSummary = idlePayload?.summary || null;

      const rightSizingRecs = Array.isArray(rightPayload?.recommendations)
        ? rightPayload.recommendations
        : [];

      const rightSizingSummary = rightPayload?.summary || null;

      const commitments = commitPayload || null;

      // derive "opportunities" for existing UI tab
      // (your current OpportunitiesTab expects an array with savings fields)
      const opportunities: Opportunity[] = allRecommendations.map(
        (r: RecommendationRaw) =>
          ({
            id: r.id,
            name: r.resourceName || r.name || r.resourceId,
            type: r.category || r.type || "recommendation",
            priority: (r.confidence || "Low").toUpperCase(), // can map differently
            savings: Number(r.potentialSavings ?? r.savings ?? 0),
            monthlyCost: Number(r.monthlyCost ?? r.currentMonthlyCost ?? 0),
            recommendation: r.recommendation,
            whyFlagged: r.whyFlagged,
            tags: r.tags || [],
            region: r.region,
            risk: r.risk,
            raw: r,
          }) as Opportunity,
      );

      const totalPotentialSavings =
        Number((summary as { totalPotentialSavings?: number } | null)?.totalPotentialSavings ?? 0) ||
        opportunities.reduce((sum: number, o: Opportunity) => sum + (o.savings || 0), 0);

      setOptimizationData({
        // what existing UI expects
        opportunities,
        idleResources,
        rightSizingRecs,

        // Client-D extras (for improved UI if you want)
        summary,
        byCategory,
        idleSummary,
        rightSizingSummary,
        commitments,

        totalPotentialSavings,
      });
    } catch (err: unknown) {
      const apiError = err as ApiLikeError;
      if (apiError?.code !== "NOT_SUPPORTED" && apiError?.name !== "AbortError") {
        console.error("Error fetching optimization data:", apiError);
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
