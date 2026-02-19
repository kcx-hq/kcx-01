// frontend/core/dashboards/overview/data-quality/hooks/useDataQuality.js
import { useEffect, useState } from "react";

const EMPTY_STATS = {
  score: 100,
  totalRows: 0,
  costAtRisk: 0,
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

export const useDataQuality = ({ filters, api, caps }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!api || !caps) return;

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.call("dataQuality", "analysis", {
          params: {
            provider: filters?.provider !== "All" ? filters.provider : undefined,
            service: filters?.service !== "All" ? filters.service : undefined,
            region: filters?.region !== "All" ? filters.region : undefined,
          },
        });

        if (!isMounted) return;

        if (res?.success && res?.data) setStats(res.data);
        else if (res?.data) setStats(res.data);
        else if (res) setStats(res);
        else setStats(EMPTY_STATS);
      } catch (error) {
        if (error?.code === "NOT_SUPPORTED") return;
        console.error("Error fetching quality data:", error);
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

