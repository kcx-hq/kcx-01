import { useState, useCallback } from 'react';

/**
 * Hook to handle API calls with loading and error states
 * 
 * @param {Object} api - API client from useCaps
 * @returns {Object} { callApi, loading, error }
 */
export function useApiCall(api) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = useCallback(async (moduleKey, endpointKey, options = {}) => {
    if (!api) {
      setError(new Error('API client not available'));
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.call(moduleKey, endpointKey, options);
      return data;
    } catch (err) {
      if (err.code === 'NOT_SUPPORTED') {
        // Endpoint not available - return null instead of error
        return null;
      }
      
      // Handle 401 - unauthorized
      if (err.response?.status === 401) {
        // Could redirect to login here if needed
        setError(new Error('Unauthorized - please log in again'));
        return null;
      }

      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  return { callApi, loading, error };
}
