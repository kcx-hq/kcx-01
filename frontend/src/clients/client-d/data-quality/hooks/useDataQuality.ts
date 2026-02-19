import { useEffect, useRef, useState } from "react";
import { normalizeDataQualityResponse, EMPTY_DQ_STATS } from "../utils/normalizeDataQuality";

export const useDataQuality = ({ filters, api, caps }) => {
  const abortRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!api || !caps) return;
    if (!caps.modules?.dataQuality?.enabled) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.call("dataQuality", "analysis", {
          params: {
            provider: filters?.provider !== "All" ? filters.provider : undefined,
            service: filters?.service !== "All" ? filters.service : undefined,
            region: filters?.region !== "All" ? filters.region : undefined,
            uploadId: filters?.uploadId || undefined,
          },
          signal: abortRef.current.signal,
        });

        if (!mounted) return;
        const normalized = normalizeDataQualityResponse(res);
        setStats(normalized);
      } catch (e) {
        if (e?.name === "AbortError") return;
        if (e?.code === "NOT_SUPPORTED") return;

        console.error("Error fetching data quality:", e);
        if (mounted) {
          setError(e?.message || "Failed to load data quality");
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
