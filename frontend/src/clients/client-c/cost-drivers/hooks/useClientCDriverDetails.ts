import { useState, useEffect } from 'react';
import { useApiCall } from '../../../../hooks/useApiCall';

export const useClientCDriverDetails = ({
  api,
  caps,
  driver,
  uploadId,
  period,
}) => {
  const [data, setData] = useState({
    loading: false,
    errorMessage: null,
    stats: null,
  });

  const { callApi: fetchDriverDetails } = useApiCall(api);

  const fetchData = async () => {
    if (!api || !caps || !caps.modules?.costDrivers?.enabled || !driver) {
      return;
    }

    setData(prev => ({
      ...prev,
      loading: true,
      errorMessage: null
    }));

    try {
      const response = await fetchDriverDetails(
        'costDrivers',
        'driverDetails',
        {
          data: {
            driver,
            period,
            ...(uploadId ? { uploadId } : {})
          }
        }
      );

      if (response.success) {
        setData({
          loading: false,
          errorMessage: null,
          stats: response.data?.stats || null
        });
      } else {
        setData(prev => ({
          ...prev,
          loading: false,
          errorMessage: response.error || 'Failed to fetch driver details'
        }));
      }
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        errorMessage: error.message || 'Network error occurred'
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [driver?.name, period, uploadId]);

  return data;
};