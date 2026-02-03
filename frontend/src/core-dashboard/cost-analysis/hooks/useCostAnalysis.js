import { useEffect, useRef, useState } from "react";
import { useDashboardStore } from "../../../store/Dashboard.store";

export function useCostAnalysis({ api, caps, filters, groupBy }) {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  const uploadIds = useDashboardStore((s) => s.uploadIds);
  const uploadIdsKey = (Array.isArray(uploadIds) ? uploadIds.join(",") : "") || "";

  const provider = filters?.provider ?? "";
  const service = filters?.service ?? "";
  const region = filters?.region ?? "";

  useEffect(() => {
    if (!api || !caps) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const run = async () => {
      if (isInitialLoadRef.current) setLoading(true);
      else setIsRefreshing(true);

      try {
        const params = {
          provider: provider && provider !== "All" ? provider : undefined,
          service: service && service !== "All" ? service : undefined,
          region: region && region !== "All" ? region : undefined,
          groupBy,
        };

        const res = await api.call("costAnalysis", "costAnalysis", { params });
        if (abortController.signal.aborted) return;

        const payload = res?.data ?? res;
        setApiData(payload);
        setError(null);
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
    return () => abortController.abort();
  }, [api, caps, provider, service, region, groupBy, uploadIdsKey]);

  return { loading, isRefreshing, apiData, error };
}
