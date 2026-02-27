import { useCallback, useEffect, useState } from 'react';
import { useApiCall } from '../../../../hooks/useApiCall';
import type {
  ApiLikeError,
  DriverDetailsState,
  DriverStats,
  UseClientCDriverDetailsParams,
} from '../types';

export const useClientCDriverDetails = ({
  api,
  caps,
  driver,
  uploadId,
  period,
}: UseClientCDriverDetailsParams): DriverDetailsState => {
  const [data, setData] = useState<DriverDetailsState>({
    loading: false,
    errorMessage: null,
    stats: null,
  });

  const { callApiTyped: fetchDriverDetails } = useApiCall(api);

  const fetchData = useCallback(async () => {
    if (!api || !caps || !caps.modules?.["costDrivers"]?.enabled || !driver) {
      return;
    }

    setData((prev: DriverDetailsState) => ({
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

      if (!response) {
        setData((prev: DriverDetailsState) => ({
          ...prev,
          loading: false,
          errorMessage: 'Failed to fetch driver details'
        }));
        return;
      }

      setData({
        loading: false,
        errorMessage: null,
        stats: ((response as { stats?: unknown }).stats || null) as DriverStats | null,
      });
    } catch (error: unknown) {
      const typedError = error as ApiLikeError;
      setData((prev: DriverDetailsState) => ({
        ...prev,
        loading: false,
        errorMessage: typedError.message || 'Network error occurred'
      }));
    }
  }, [api, caps, driver, period, uploadId, fetchDriverDetails]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  return data;
};
