import { useEffect, useRef, useState } from 'react';
import type {
  ApiLikeError,
  ResourceItem,
  ResourceInventoryPayload,
  ResourceStats,
  UseResourceInventoryDataParams,
  UseResourceInventoryDataResult,
} from "../types";

const DEFAULT_STATS: ResourceStats = {
  total: 0,
  totalCost: 0,
  zombieCount: 0,
  zombieCost: 0,
  untaggedCount: 0,
  untaggedCost: 0,
  spikingCount: 0,
  spikingCost: 0,
};

export function useResourceInventoryData({
  filters,
  api,
  caps,
}: UseResourceInventoryDataParams): UseResourceInventoryDataResult {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inventory, setInventory] = useState<ResourceItem[]>([]);
  const [stats, setStats] = useState<ResourceStats>(DEFAULT_STATS);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (!api || !caps) return;

    const fetchData = async () => {
      if (hasLoadedOnceRef.current) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const data = await api.call<{ data?: ResourceInventoryPayload }>('resources', 'inventory', {
          params: {
            provider: filters.provider !== 'All' ? filters.provider : undefined,
            service: filters.service !== 'All' ? filters.service : undefined,
            region: filters.region !== 'All' ? filters.region : undefined,
            uploadId: filters.uploadId,
          },
        });

        const payload = (data?.data ?? data) as ResourceInventoryPayload | null;

        if (payload) {
          setInventory(payload.inventory || []);
          setStats({ ...DEFAULT_STATS, ...(payload.stats || {}) });
        }
      } catch (err: unknown) {
        const error = err as ApiLikeError;
        if (error?.code === 'NOT_SUPPORTED') return;
        console.error('Failed to fetch inventory:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        hasLoadedOnceRef.current = true;
      }
    };

    fetchData();
  }, [filters, api, caps]);

  return { loading, refreshing, inventory, stats };
}



