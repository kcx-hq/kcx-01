import { useState, useEffect, useMemo } from 'react';
import { useApiCall } from '../../../../hooks/useApiCall';

export const useClientCCostDriversData = ({
  api,
  caps,
  period,
  dimension,
  minChange,
  debouncedPeriod,
  debouncedDimension,
  debouncedMinChange,
}) => {
  const [data, setData] = useState({
    loading: false,
    isRefreshing: false,
    errorMessage: null,
    increases: [],
    decreases: [],
    overallStats: null,
    periods: null,
    availableServices: [],
  });

  const { callApi: fetchCostDriversData } = useApiCall(api);

  const fetchData = async (isRefresh = false) => {
    console.log('useClientCCostDriversData: fetchData called', { isRefresh, api: !!api, caps: !!caps, enabled: caps?.modules?.costDrivers?.enabled });
    if (!api || !caps || !caps.modules?.costDrivers?.enabled) {
      console.log('useClientCCostDriversData: early return', { api: !!api, caps: !!caps, enabled: caps?.modules?.costDrivers?.enabled });
      return;
    }

    setData(prev => ({
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

      console.log('useClientCCostDriversData: response received', response);
      if (response.success) {
        console.log('useClientCCostDriversData: success response', response.data);
        setData({
          loading: false,
          isRefreshing: false,
          errorMessage: null,
          increases: response.data?.increases || [],
          decreases: response.data?.decreases || [],
          overallStats: response.data?.overallStats || null,
          periods: response.data?.periods || null,
          availableServices: response.data?.availableServices || []
        });
      } else {
        console.log('useClientCCostDriversData: error response', response.error);
        setData(prev => ({
          ...prev,
          loading: false,
          isRefreshing: false,
          errorMessage: response.error || 'Failed to fetch cost drivers data'
        }));
      }
    } catch (error) {
      console.error('useClientCCostDriversData: error caught', error);
      setData(prev => ({
        ...prev,
        loading: false,
        isRefreshing: false,
        errorMessage: error.message || 'Network error occurred'
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedPeriod, debouncedDimension, debouncedMinChange]);

  const refresh = () => fetchData(true);

  return {
    ...data,
    refresh
  };
};