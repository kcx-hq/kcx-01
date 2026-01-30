import { useEffect, useState } from "react";

const EMPTY = {
  kpis: {
    totalCost: 0,
    totalQuantity: 0,
    avgUnitPrice: 0,
    unitPriceChangePct: 0,
    driftDetected: false,
  },
  trend: [],
  drift: null,
  skuEfficiency: [],
};

export function useUnitEconomicsData({ api, caps, filters }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(EMPTY);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!api || !caps) return;
    if (!caps.modules?.unitEconomics?.enabled) return;

    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.call("unitEconomics", "summary", {
          params: {
            provider: filters?.provider !== "All" ? filters.provider : undefined,
            service: filters?.service !== "All" ? filters.service : undefined,
            region: filters?.region !== "All" ? filters.region : undefined,
            uploadId: filters?.uploadId || undefined,
          },
        });

        if (!mounted) return;

        const raw = res?.data ?? res;
        const payload = raw?.success && raw?.data ? raw.data : raw?.data ?? raw ?? EMPTY;

        setData(payload || EMPTY);
      } catch (e) {
        if (!mounted) return;
        if (e?.code === "NOT_SUPPORTED") return;

        console.error("UnitEconomics fetch failed:", e);
        setError(`Failed to load Unit Economics: ${e?.message || "Unknown error"}`);
        setData(EMPTY);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [api, caps, filters?.provider, filters?.service, filters?.region, filters?.uploadId]);

  return { loading, data, error };
}
