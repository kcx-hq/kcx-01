import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../../../hooks/useDebounce';
import type {
  ApiLikeError,
  ResourceInventoryData,
  ResourceInventoryFilters,
  UseClientCResourceInventoryDataResult,
} from '../types';
import type { ApiClient, Capabilities } from '../../../../services/apiClient';

/**
 * Custom hook for fetching resource inventory data for Client-C
 */
export const useClientCResourceInventoryData = (
  initialFilters: Partial<ResourceInventoryFilters> = {},
  api: ApiClient | null,
  caps: Capabilities | null,
  uploadId: string | undefined = undefined,
): UseClientCResourceInventoryDataResult => {
  const [data, setData] = useState<ResourceInventoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce filters to avoid excessive API calls
  const debouncedFilters = useDebounce(initialFilters, 500);

  const fetchData = useCallback(async () => {
    if (!api || !caps) {
      setError('API or capabilities not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare parameters for API call
      const params: Record<string, string> = {
        provider: debouncedFilters?.provider || 'All',
        service: debouncedFilters?.service || 'All',
        region: debouncedFilters?.region || 'All'
      };

      // Add uploadId if available
      if (uploadId) {
        params["uploadId"] = uploadId;
      }

      if (import.meta.env.DEV) {
        console.log('Attempting resources inventory API call with params:', params);
      }

      const response = await api.call<ResourceInventoryData>("resources", "inventory", { params });
      setData(response || null);
    } catch (err: unknown) {
      const apiError = err as ApiLikeError;
      console.error('Error fetching resource inventory data:', err);
      setError(apiError.message || 'Failed to fetch resource inventory data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [api, caps, debouncedFilters, uploadId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
