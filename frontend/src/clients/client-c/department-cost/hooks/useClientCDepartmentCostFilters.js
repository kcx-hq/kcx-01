// hooks/useClientCDepartmentCostFilters.js
import { useState, useEffect } from 'react';

export const useClientCDepartmentCostFilters = (api, caps) => {
  const [filterOptions, setFilterOptions] = useState({
    providers: [],
    services: [],
    regions: [],
    departments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        if (caps.modules?.departmentCost?.endpoints?.filters) {
          const response = await api.call('departmentCost', 'filters', {});
          
          if (response.success) {
            setFilterOptions(response.data || {
              providers: [],
              services: [],
              regions: [],
              departments: []
            });
          }
        } else {
          // Fallback to general filters if department cost filters endpoint doesn't exist
          if (caps.modules?.overview?.endpoints?.filters) {
            const response = await api.call('overview', 'filters', {});
            
            if (response.success) {
              setFilterOptions(response.data || {
                providers: [],
                services: [],
                regions: [],
                departments: []
              });
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch filter options');
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