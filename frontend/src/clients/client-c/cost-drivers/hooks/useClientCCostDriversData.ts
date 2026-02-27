import { useCallback, useEffect, useState } from 'react';
import { useApiCall } from '../../../../hooks/useApiCall';
import type {
  ApiLikeError,
  CostDriverItem,
  CostDriversDataState,
  DriverOverallStats,
  DriverPeriods,
  UseClientCCostDriversDataParams,
  UseClientCCostDriversDataResult,
} from '../types';

export const useClientCCostDriversData = ({
  api,
  caps,
  debouncedPeriod,
  debouncedDimension,
  debouncedMinChange,
}: UseClientCCostDriversDataParams): UseClientCCostDriversDataResult => {
  const [data, setData] = useState<CostDriversDataState>({
    loading: false,
    isRefreshing: false,
    errorMessage: null,
    increases: [],
    decreases: [],
    overallStats: null,
    periods: null,
    availableServices: [],
  });

  const { callApiTyped: fetchCostDriversData } = useApiCall(api);

  const fetchData = useCallback(async (isRefresh = false): Promise<void> => {
    console.log('useClientCCostDriversData: fetchData called', { isRefresh, api: !!api, caps: !!caps, enabled: caps?.modules?.["costDrivers"]?.enabled });
    if (!api || !caps || !caps.modules?.["costDrivers"]?.enabled) {
      console.log('useClientCCostDriversData: early return', { api: !!api, caps: !!caps, enabled: caps?.modules?.["costDrivers"]?.enabled });
      return;
    }

    setData((prev: CostDriversDataState) => ({
      ...prev,
      loading: !isRefresh,
      isRefreshing: isRefresh,
      errorMessage: null
    }));

    try {
      console.log('useClientCCostDriversData: calling fetchCostDriversData', {
        period: debouncedPeriod,
        dimension: debouncedDimension,
        minChange: debouncedMinChange
      });
      const response = await fetchCostDriversData(
        'costDrivers',
        'costDrivers',
        {
          params: {
            period: debouncedPeriod,
            dimension: debouncedDimension,
            minChange: debouncedMinChange
          }
        }
      );

      if (!response) {
        setData((prev: CostDriversDataState) => ({
          ...prev,
          loading: false,
          isRefreshing: false,
          errorMessage: 'Failed to fetch cost drivers data'
        }));
        return;
      }

      console.log('useClientCCostDriversData: response received', response);
      setData({
        loading: false,
        isRefreshing: false,
        errorMessage: null,
        increases: ((response as { increases?: unknown[] }).increases || []) as CostDriverItem[],
        decreases: ((response as { decreases?: unknown[] }).decreases || []) as CostDriverItem[],
        overallStats: (((response as { overallStats?: unknown }).overallStats) || null) as DriverOverallStats | null,
        periods: (((response as { periods?: unknown }).periods) || null) as DriverPeriods | null,
        availableServices: (((response as { availableServices?: unknown[] }).availableServices || []) as unknown[]).filter(
          (service): service is string => typeof service === "string",
        ),
      });
    } catch (error: unknown) {
      const typedError = error as ApiLikeError;
      console.error('useClientCCostDriversData: error caught', error);
      setData((prev: CostDriversDataState) => ({
        ...prev,
        loading: false,
        isRefreshing: false,
        errorMessage: typedError.message || 'Network error occurred'
      }));
    }
  }, [api, caps, debouncedPeriod, debouncedDimension, debouncedMinChange, fetchCostDriversData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const refresh = () => fetchData(true);

  return {
    ...data,
    refresh
  };
};
