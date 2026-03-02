import { useState, useEffect } from 'react';
import { getCachedCapabilities } from '../services/getCapabilities';
import { fetchCapabilities } from '../services/capabilities.api';
import { createApiClient } from '../services/apiClient';
import type { ApiClient, Capabilities } from '../services/apiClient';

/**
 * Hook to load capabilities and create API client
 * 
 * @returns {Object} { caps, api, loading, error }
 *   - caps: capabilities object from localStorage or API
 *   - api: createApiClient(caps) instance
 *   - loading: boolean indicating if capabilities are being loaded
 *   - error: error object if loading failed
 */
export function useCaps() {
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [api, setApi] = useState<ApiClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCapabilities() {
      try {
        // 1. Try to load from localStorage instantly
        const cached = getCachedCapabilities();
        if (cached && mounted) {
          setCaps(cached);
          setApi(createApiClient(cached));
          setLoading(false);
        }

        // 2. Always revalidate capabilities from API (stale-while-revalidate)
        const fetched = await fetchCapabilities();
        
        // Cache the fetched capabilities
        if (fetched) {
          localStorage.setItem(
            'capabilities',
            JSON.stringify({
              version: 'v1',
              cachedAt: Date.now(),
              value: fetched,
            })
          );
        }

        if (mounted) {
          if (fetched) {
            setCaps(fetched);
            setApi(createApiClient(fetched));
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error('Failed to load capabilities:', err);
        
        // If fetch failed but we have cached capabilities, use them as fallback
        const cached = getCachedCapabilities();
        if (cached && mounted) {
          console.warn('Using cached capabilities due to fetch failure');
          setCaps(cached);
          setApi(createApiClient(cached));
          setLoading(false);
          return;
        }
        
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    }

    loadCapabilities();

    return () => {
      mounted = false;
    };
  }, []);

  return { caps, api, loading, error };
}
