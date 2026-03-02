import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { ApiLikeError } from "../types";

interface UseGovernanceRequestParams<T> {
  api: ApiClient | null;
  caps: Capabilities | null;
  endpoint: string;
  params: Record<string, string>;
  fallback?: (analysis: unknown) => T | null;
}

interface UseGovernanceRequestResult<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGovernanceRequest<T>({
  api,
  caps,
  endpoint,
  params,
  fallback,
}: UseGovernanceRequestParams<T>): UseGovernanceRequestResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fallbackRef = useRef(fallback);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    fallbackRef.current = fallback;
  }, [fallback]);

  const paramsKey = useMemo(() => JSON.stringify(params || {}), [params]);
  const stableParams = useMemo<Record<string, string>>(() => {
    try {
      const parsed = JSON.parse(paramsKey);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      // no-op
    }
    return {};
  }, [paramsKey]);

  const fetchData = useCallback(async () => {
    if (!api || !caps?.modules?.dataQuality?.enabled) {
      setData(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (hasLoadedOnceRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const canEndpoint = Boolean(caps.modules?.dataQuality?.endpoints?.[endpoint]);
      if (canEndpoint) {
        const payload = await api.call<T>("dataQuality", endpoint, { params: stableParams });
        setData(payload);
        setLoading(false);
        return;
      }

      if (fallbackRef.current) {
        const analysis = await api.call("dataQuality", "analysis", { params: stableParams });
        setData(fallbackRef.current(analysis));
      } else {
        setData(null);
      }
    } catch (err: unknown) {
      const apiError = err as ApiLikeError;
      if (apiError?.code !== "NOT_SUPPORTED") {
        console.error(`Failed to fetch governance endpoint ${endpoint}:`, apiError);
        setError(apiError?.message || "Failed to load governance data");
      }
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
      hasLoadedOnceRef.current = true;
    }
  }, [api, caps, endpoint, stableParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refreshing, error, refetch: fetchData };
}

export default useGovernanceRequest;
