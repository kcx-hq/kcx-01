import { useEffect, useState } from "react";
import type {
  ApiLikeError,
  UnitEconomicsData,
  UseUnitEconomicsDataParams,
  UseUnitEconomicsDataResult,
} from "../types";

const EMPTY: UnitEconomicsData = {
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

export function useUnitEconomicsData({
  api,
  caps,
  filters,
}: UseUnitEconomicsDataParams): UseUnitEconomicsDataResult {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const provider = filters?.provider;
  const service = filters?.service;
  const region = filters?.region;
  const uploadId = filters?.uploadId;

  useEffect(() => {
    if (!api || !caps) return;
    if (!caps.modules?.["unitEconomics"]?.enabled) return;

    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.call<UnitEconomicsApiResponse>("unitEconomics", "summary", {
          params: {
            provider: provider !== "All" ? provider : undefined,
            service: service !== "All" ? service : undefined,
            region: region !== "All" ? region : undefined,
            uploadId: uploadId || undefined,
          },
        });

        if (!mounted) return;

        const payload = res as UnitEconomicsData | null | undefined;

        setData(payload ?? EMPTY);
      } catch (e: unknown) {
        const err = e as ApiLikeError;
        if (!mounted) return;
        if (err?.code === "NOT_SUPPORTED") return;

        console.error("UnitEconomics fetch failed:", err);
        setError(`Failed to load Unit Economics: ${err?.message || "Unknown error"}`);
        setData(EMPTY);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [api, caps, provider, service, region, uploadId]);

  return { loading, data, error };
}
