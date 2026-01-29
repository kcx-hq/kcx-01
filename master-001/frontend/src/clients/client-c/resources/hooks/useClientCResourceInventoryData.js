import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../../../hooks/useDebounce';

/**
 * Custom hook for fetching resource inventory data for Client-C
 */
export const useClientCResourceInventoryData = (initialFilters = {}, api, caps, uploadId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const params = {
        provider: debouncedFilters?.provider || 'All',
        service: debouncedFilters?.service || 'All',
        region: debouncedFilters?.region || 'All'
      };

      // Add uploadId if available
      if (uploadId) {
        params.uploadId = uploadId;
      }

      // Try multiple API call approaches to ensure compatibility
      let res;
      try {
        // Primary API call using capabilities system
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Attempting resources inventory API call with params:', params);
        }
        
        res = await api.call("resources", "inventory", { params });
      } catch (primaryError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🔍 Primary API call failed, trying direct HTTP call:', primaryError);
        }

        // Fallback to direct HTTP call
        try {
          res = await api.http.get("/api/client-c/resources/inventory", { params });
        } catch (httpError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('🔍 Direct HTTP call also failed:', httpError);
          }
          throw httpError;
        }
      }

      if (res?.success) {
        setData(res.data);
      } else {
        throw new Error(res?.error || 'Failed to fetch resource inventory data');
      }
    } catch (err) {
      console.error('Error fetching resource inventory data:', err);
      setError(err.message || 'Failed to fetch resource inventory data');
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