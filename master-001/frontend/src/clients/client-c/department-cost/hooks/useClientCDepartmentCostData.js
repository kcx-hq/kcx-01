import { useState, useEffect } from 'react';

export const useClientCDepartmentCostData = (api, caps, filters = {}, forceRefreshKey = 0) => {
  const [departmentData, setDepartmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      if (!api || !caps.modules?.departmentCost) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const params = {
          provider: filters.provider !== 'All' ? filters.provider : undefined,
          service: filters.service !== 'All' ? filters.service : undefined,
          region: filters.region !== 'All' ? filters.region : undefined,
          uploadId: filters.uploadId,
        };

        // Fetch all department cost endpoints
        const [overviewRes, trendRes, drilldownRes] = await Promise.allSettled([
          api.call('departmentCost', 'overview', { params }),
          api.call('departmentCost', 'trend', { params }),
          api.call('departmentCost', 'drilldown', { params })
        ]);

        const overviewData = overviewRes.status === 'fulfilled' && overviewRes.value?.success 
          ? overviewRes.value.data 
          : { departments: [], totalCost: 0 };

        const trendData = trendRes.status === 'fulfilled' && trendRes.value?.success 
          ? trendRes.value.data 
          : { daily: [], totalCost: 0 };

        const drilldownData = drilldownRes.status === 'fulfilled' && drilldownRes.value?.success 
          ? drilldownRes.value.data 
          : { services: [], resources: [] };

        if (isActive) {
          setDepartmentData({
            overview: overviewData,
            trend: trendData,
            drilldown: drilldownData
          });
          setError(null);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || 'Failed to fetch department cost data');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isActive = false;
    };
  }, [api, caps, filters, forceRefreshKey]);

  return {
    departmentData,
    loading,
    error,
    isFiltering
  };
};