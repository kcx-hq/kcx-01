import { useEffect, useRef, useState } from 'react';

export function useDriverDetails({ api, caps, driver, period }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    trendData: [],
    subDrivers: [],
    topResources: [],
    annualizedImpact: 0,
    insightText: '',
  });

  const cacheRef = useRef(new Map());

  useEffect(() => {
    const run = async () => {
      if (!driver || !api || !caps) return;

      const cacheKey = `${driver.id || driver.name}-${period}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setStats(cached);
        return;
      }

      setLoading(true);
      try {
        const data = await api.call('costDrivers', 'driverDetails', {
          data: { driver, period },
        });

        const result =
          (data?.success && data?.data) ? data.data :
          (data?.data) ? data.data :
          (data ?? stats);

        setStats(result);
        cacheRef.current.set(cacheKey, result);
      } catch (err) {
        if (err?.code !== 'NOT_SUPPORTED') {
          // eslint-disable-next-line no-console
          console.error('Error fetching driver details:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver, period, api, caps]);

  return { loading, stats };
}
