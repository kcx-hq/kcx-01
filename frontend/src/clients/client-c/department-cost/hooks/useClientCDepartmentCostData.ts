import { useState, useEffect } from 'react';
import type { ApiClient, Capabilities } from "../../../../services/apiClient";
import type {
  ApiLikeError,
  DepartmentCostFilters,
  DepartmentCostSourceData,
  UseClientCDepartmentCostDataResult,
} from "../types";

export const useClientCDepartmentCostData = (
  api: ApiClient | null,
  caps: Capabilities | null,
  filters: Partial<DepartmentCostFilters> = {},
  forceRefreshKey: number = 0,
): UseClientCDepartmentCostDataResult => {
  const [departmentData, setDepartmentData] = useState<DepartmentCostSourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      if (!api || !caps?.modules?.["departmentCost"]) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const params: Record<string, string | undefined> = {
          provider: filters.provider !== 'All' ? filters.provider : undefined,
          service: filters.service !== 'All' ? filters.service : undefined,
          region: filters.region !== 'All' ? filters.region : undefined,
          uploadId: filters.uploadId,
        };

        // Fetch all department cost endpoints
        const [overviewRes, trendRes, drilldownRes] = await Promise.allSettled([
          api.call<DepartmentCostSourceData["overview"]>('departmentCost', 'overview', { params }),
          api.call<DepartmentCostSourceData["trend"]>('departmentCost', 'trend', { params }),
          api.call<DepartmentCostSourceData["drilldown"]>('departmentCost', 'drilldown', { params })
        ]);

        const overviewData = overviewRes.status === 'fulfilled'
          ? (overviewRes.value ?? { departments: [], totalCost: 0 })
          : { departments: [], totalCost: 0 };

        const trendData = trendRes.status === 'fulfilled'
          ? (trendRes.value ?? { daily: [], totalCost: 0 })
          : { daily: [], totalCost: 0 };

        const drilldownData = drilldownRes.status === 'fulfilled'
          ? (drilldownRes.value ?? { services: [], resources: [] })
          : { services: [], resources: [] };

        if (isActive) {
          setDepartmentData({
            overview: overviewData,
            trend: trendData,
            drilldown: drilldownData
          });
          setError(null);
        }
      } catch (err: unknown) {
        const apiError = err as ApiLikeError;
        if (isActive) {
          setError(apiError.message || 'Failed to fetch department cost data');
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
    isFiltering: false
  };
};
