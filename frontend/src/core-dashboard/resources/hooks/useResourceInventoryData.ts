import { useEffect, useState } from 'react';

export function useResourceInventoryData({ filters, api, caps }) {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    totalCost: 0,
    zombieCount: 0,
    zombieCost: 0,
    untaggedCount: 0,
    untaggedCost: 0,
    spikingCount: 0,
    spikingCost: 0,
  });

  useEffect(() => {
    if (!api || !caps) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await api.call('resources', 'inventory', {
          params: {
            provider: filters.provider !== 'All' ? filters.provider : undefined,
            service: filters.service !== 'All' ? filters.service : undefined,
            region: filters.region !== 'All' ? filters.region : undefined,
            uploadId: filters.uploadId,
          },
        });

        const payload = data?.data ?? data;

        if (payload) {
          setInventory(payload.inventory || []);
          setStats(payload.stats || {});
        }
      } catch (err) {
        if (err?.code === 'NOT_SUPPORTED') return;
        console.error('Failed to fetch inventory:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, api, caps]);

  return { loading, inventory, stats };
}
