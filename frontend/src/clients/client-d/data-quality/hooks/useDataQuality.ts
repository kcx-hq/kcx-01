import { useEffect, useRef, useState } from "react";
import { normalizeDataQualityResponse, EMPTY_DQ_STATS } from "../utils/normalizeDataQuality";
import type { ApiLikeError, DataQualityStats, UseDataQualityParams, UseDataQualityResult } from "../types";
import type { ApiCallOptions } from "../../../../services/apiClient";

export const useDataQuality = ({ filters, api, caps }: UseDataQualityParams): UseDataQualityResult => {
  const abortRef = useRef<AbortController | null>(null);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DataQualityStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !caps) return;
    if (!caps.modules?.["dataQuality"]?.enabled) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const controller = abortRef.current;
        if (!controller) return;

        const requestOptions = {
          params: {
            provider: filters?.provider !== "All" ? filters.provider : undefined,
            service: filters?.service !== "All" ? filters.service : undefined,
            region: filters?.region !== "All" ? filters.region : undefined,
            uploadId: filters?.uploadId || undefined,
          },
          signal: controller.signal,
        } as unknown as ApiCallOptions;

        const res = await api.call<unknown>("dataQuality", "analysis", requestOptions);

        if (!mounted) return;
        const normalized = normalizeDataQualityResponse(res);
        setStats(normalized);
      } catch (e: unknown) {
        const apiError = e as ApiLikeError;
        if (apiError?.name === "AbortError") return;
        if (apiError?.code === "NOT_SUPPORTED") return;

        console.error("Error fetching data quality:", apiError);
        if (mounted) {
          setError(apiError?.message || "Failed to load data quality");
          setStats(EMPTY_DQ_STATS);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, [filters, api, caps]);

  return { loading, stats, error };
};
