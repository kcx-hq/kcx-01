import { useEffect, useRef, useState } from 'react';
import { DEFAULT_DYNAMICS, DEFAULT_OVERALL_STATS, DEFAULT_PERIODS } from '../utils/constants';

export function useCostDriversData({
  api,
  caps,
  filters,
  period,
  dimension,
  minChange,
  debouncedFilters,
  debouncedPeriod,
  debouncedDimension,
  debouncedMinChange,
}) {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [increases, setIncreases] = useState([]);
  const [decreases, setDecreases] = useState([]);
  const [overallStats, setOverallStats] = useState(DEFAULT_OVERALL_STATS);
  const [dynamics, setDynamics] = useState(DEFAULT_DYNAMICS);
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [availableServices, setAvailableServices] = useState(['All']);

  const isInitialMount = useRef(true);
  const abortControllerRef = useRef(null);

  const prevFiltersRef = useRef(filters);
  const prevPeriodRef = useRef(period);

  useEffect(() => {
    if (!api || !caps || !caps.modules?.costDrivers?.enabled) return;

    const filtersChanged =
      prevFiltersRef.current.provider !== filters.provider ||
      prevFiltersRef.current.service !== filters.service ||
      prevFiltersRef.current.region !== filters.region;

    const periodChanged = prevPeriodRef.current !== period;

    if (!isInitialMount.current && !filtersChanged && !periodChanged) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const fetchData = async () => {
      if (isInitialMount.current) setLoading(true);
      else setIsRefreshing(true);

      setErrorMessage(null);

      try {
        const data = await api.call('costDrivers', 'costDrivers', {
          params: {
            provider: debouncedFilters.provider !== 'All' ? debouncedFilters.provider : undefined,
            service: debouncedFilters.service !== 'All' ? debouncedFilters.service : undefined,
            region: debouncedFilters.region !== 'All' ? debouncedFilters.region : undefined,
            period: debouncedPeriod,
            dimension: debouncedDimension,
            minChange: debouncedMinChange,
          },
        });

        if (abortControllerRef.current?.signal.aborted) return;

        const resultData =
          (data?.success && data?.data) ? data.data :
          (data?.data) ? data.data :
          (data ?? {});

        setIncreases(Array.isArray(resultData.increases) ? resultData.increases : []);
        setDecreases(Array.isArray(resultData.decreases) ? resultData.decreases : []);
        setOverallStats(resultData.overallStats || DEFAULT_OVERALL_STATS);
        setDynamics(resultData.dynamics || DEFAULT_DYNAMICS);

        if (resultData.periods) {
          setPeriods({
            current: resultData.periods.current ? new Date(resultData.periods.current) : null,
            prev: resultData.periods.prev ? new Date(resultData.periods.prev) : null,
            max: resultData.periods.max ? new Date(resultData.periods.max) : null,
          });
        } else {
          setPeriods(DEFAULT_PERIODS);
        }

        if (Array.isArray(resultData.availableServices) && resultData.availableServices.length > 0) {
          setAvailableServices(['All', ...resultData.availableServices]);
        } else {
          setAvailableServices(['All']);
        }

        if (resultData.message) setErrorMessage(resultData.message);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (!abortControllerRef.current?.signal.aborted) {
          setErrorMessage('Error loading cost drivers. Please try again.');
          // eslint-disable-next-line no-console
          console.error('Error fetching cost drivers:', err);
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
          setIsRefreshing(false);
          if (isInitialMount.current) isInitialMount.current = false;
          prevFiltersRef.current = { ...filters };
          prevPeriodRef.current = period;
        }
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [
    api,
    caps,
    filters,
    period,
    debouncedFilters,
    debouncedPeriod,
    debouncedDimension,
    debouncedMinChange,
  ]);

  return {
    loading,
    isRefreshing,
    errorMessage,
    increases,
    decreases,
    overallStats,
    dynamics,
    periods,
    availableServices,
  };
}
