// hooks/useClientCDepartmentCostFilters.js
import { useState, useEffect } from 'react';
import type {
  ApiLikeError,
  DepartmentCostFilterOptions,
  UseClientCDepartmentCostFiltersResult,
} from "../types";
import type { ApiClient, Capabilities } from "../../../../services/apiClient";

export const useClientCDepartmentCostFilters = (
  api: ApiClient | null,
  caps: Capabilities | null,
): UseClientCDepartmentCostFiltersResult => {
  const [filterOptions, setFilterOptions] = useState<DepartmentCostFilterOptions>({
    providers: [],
    services: [],
    regions: [],
    departments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!api || !caps) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if filter endpoint exists
        if (caps.modules?.["departmentCost"]?.endpoints?.["filters"]) {
          const response = await api.call<DepartmentCostFilterOptions>('departmentCost', 'filters', {});
          setFilterOptions(response || {
            providers: [],
            services: [],
            regions: [],
            departments: []
          });
        } else {
          // Fallback to general filters if department cost filters endpoint doesn't exist
          if (caps.modules?.["overview"]?.endpoints?.["filters"]) {
            const response = await api.call<DepartmentCostFilterOptions>('overview', 'filters', {});
            setFilterOptions(response || {
              providers: [],
              services: [],
              regions: [],
              departments: []
            });
          }
        }
      } catch (err: unknown) {
        const apiError = err as ApiLikeError;
        setError(apiError.message || 'Failed to fetch filter options');
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, [api, caps]);

  return {
    filterOptions,
    loading,
    error
  };
};
