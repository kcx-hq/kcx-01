import { useCallback, useEffect, useRef, useState } from "react";
import { buildParamsFromFilters } from "../utils/helpers";
import { buildActionCenterModel } from "../utils/actionCenterModel";

export function useOptimizationData({ api, caps, parentFilters }) {
  const [optimizationData, setOptimizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const isInitialMount = useRef(true);
  const abortControllerRef = useRef(null);
  const prevFiltersRef = useRef({});

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
      const enabled = !!mod?.enabled;

      const canOpp = enabled && !!mod?.endpoints?.opportunities;
      const canIdle = enabled && !!mod?.endpoints?.idleResources;
      const canRight = enabled && !!mod?.endpoints?.rightSizing;
      const canCommit = enabled && !!mod?.endpoints?.commitments;
      const canTracker = enabled && !!mod?.endpoints?.tracker;
      const canActionCenter = enabled && !!mod?.endpoints?.actionCenter;

      if (canActionCenter) {
        const actionCenterRes = await api.call("optimization", "actionCenter", { params });
        if (abortControllerRef.current?.signal.aborted) return;

        const payloadCandidate = actionCenterRes?.data ?? actionCenterRes ?? {};
        const payload = payloadCandidate?.data ?? payloadCandidate;
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
          actionCenterModel:
            model ||
            buildActionCenterModel({
              opportunities,
              idleResources,
              rightSizingRecs,
              commitmentGap,
              trackerItems,
            }),
          totalPotentialSavings: opportunities.reduce((sum, opp) => sum + (opp.savings || 0), 0),
        });

        return;
      }

      const [oppRes, idleRes, rightRes, commitmentRes, trackerRes] = await Promise.all([
        canOpp ? api.call("optimization", "opportunities", { params }) : Promise.resolve(null),
        canIdle ? api.call("optimization", "idleResources", { params }) : Promise.resolve(null),
        canRight ? api.call("optimization", "rightSizing", { params }) : Promise.resolve(null),
        canCommit ? api.call("optimization", "commitments", { params }) : Promise.resolve(null),
        canTracker ? api.call("optimization", "tracker", { params }) : Promise.resolve(null),
      ]);

      if (abortControllerRef.current?.signal.aborted) return;

      const oppData = oppRes?.data ?? null;
      const idleData = idleRes?.data ?? null;
      const rightData = rightRes?.data ?? null;
      const commitmentData = commitmentRes?.data ?? null;
      const trackerData = trackerRes?.data ?? null;

      const opportunities = Array.isArray(oppData) ? oppData : oppData || [];
      const idleResources = Array.isArray(idleData) ? idleData : idleData || [];
      const rightSizingRecs = Array.isArray(rightData) ? rightData : rightData || [];
      const trackerItems = Array.isArray(trackerData) ? trackerData : trackerData || [];
      const commitmentGap = commitmentData && typeof commitmentData === "object" ? commitmentData : null;

      const actionCenterModel = buildActionCenterModel({
        opportunities,
        idleResources,
        rightSizingRecs,
        commitmentGap,
        trackerItems,
      });

      setOptimizationData({
        opportunities,
        idleResources,
        rightSizingRecs,
        commitmentGap,
        trackerItems,
        actionCenterModel,
        totalPotentialSavings: opportunities.reduce((sum, opp) => sum + (opp.savings || 0), 0),
      });
    } catch (err) {
      if (err?.code !== "NOT_SUPPORTED" && err?.name !== "AbortError") {
        // eslint-disable-next-line no-console
        console.error("Error fetching optimization data:", err);
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
