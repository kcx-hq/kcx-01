// frontend/core/dashboards/overview/data-quality/hooks/useDataQuality.js
import { useEffect, useState } from "react";
import type { ApiLikeError, DataQualityStats, UseDataQualityParams, UseDataQualityResult } from "../types";

const EMPTY_STATS: DataQualityStats = {
  score: 0,
  totalRows: 0,
  costAtRisk: 0,
  governance: null,
  buckets: {
    untagged: [],
    missingMeta: [],
    anomalies: [],
    all: [],
  },
  compliance: [],
  trendData: [],
  topOffenders: [],
};

export const useDataQuality = ({ filters, api, caps }: UseDataQualityParams): UseDataQualityResult => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DataQualityStats | null>(null);

  useEffect(() => {
    if (!api || !caps) {
      setLoading(false);
      setStats(EMPTY_STATS);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.call<unknown>("dataQuality", "analysis", {
          params: {
            provider: filters?.provider !== "All" ? filters.provider : undefined,
            service: filters?.service !== "All" ? filters.service : undefined,
            region: filters?.region !== "All" ? filters.region : undefined,
          },
        });

        if (!isMounted) return;

        const typed = res as DataQualityStats | null | undefined;
        setStats(typed ?? EMPTY_STATS);
      } catch (error: unknown) {
        const err = error as ApiLikeError;
        if (err?.code === "NOT_SUPPORTED") return;
        console.error("Error fetching quality data:", err);
        if (isMounted) setStats(EMPTY_STATS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [filters, api, caps]);

  return { loading, stats };
};




