import { useState, useCallback } from 'react';
import { ApiClientError } from "../services/apiClient";
import { isApiError } from "../services/apiError";
import type { ApiCallOptions, ApiClient } from "../services/apiClient";

/**
 * Hook to handle API calls with loading and error states
 * 
 * @param {Object} api - API client from useCaps
 * @returns {Object} { callApi, loading, error }
 */
export function useApiCall(api: ApiClient | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const callApiTyped = useCallback(async <T = unknown>(
    moduleKey: string,
    endpointKey: string,
    options: ApiCallOptions = {},
  ): Promise<T | null> => {
    if (!api) {
      setError(new Error('API client not available'));
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.call<T>(moduleKey, endpointKey, options);
      return data;
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.code === 'NOT_SUPPORTED') {
        // Endpoint not available - return null instead of error
        return null;
      }
      
      // Handle 401 - unauthorized
      if (isApiError(err) && err.status === 401) {
        // Could redirect to login here if needed
        setError(new Error('Unauthorized - please log in again'));
        return null;
      }

      setError(err instanceof Error ? err : new Error('Request failed'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const callApi = useCallback(async (
    moduleKey: string,
    endpointKey: string,
    options?: ApiCallOptions,
  ) => {
    return (await callApiTyped<unknown>(moduleKey, endpointKey, options)) as unknown;
  }, [callApiTyped]);

  return { callApi, callApiTyped, loading, error };
}
