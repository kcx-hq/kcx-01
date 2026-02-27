/**
 * Normalizes department cost data from backend to standardized format for UI components
 */
import type {
  DepartmentMetric,
  DepartmentCostSourceData,
  DepartmentOverviewItem,
  NormalizedDepartmentCostData,
} from "../types";

export const normalizeDepartmentCostData = (rawData: DepartmentCostSourceData | null | undefined): NormalizedDepartmentCostData => {
  if (!rawData) {
    return {
      overview: {
        departments: [],
        totalCost: 0,
        departmentMetrics: {}
      },
      trend: {
        daily: [],
        totalTrendCost: 0
      },
      drilldown: {
        services: [],
        resources: []
      },
      metadata: {
        isEmptyState: true
      }
    };
  }

  // Normalize overview data
  const overview = rawData.overview || {};
  const departments: DepartmentOverviewItem[] = Array.isArray(overview.departments) ? overview.departments : [];
  
  const departmentMetrics = departments.reduce<Record<string, DepartmentMetric>>((acc, dept) => {
    acc[dept.name] = {
      totalCost: dept.totalCost || 0,
      percentage: dept.percentage || 0,
      recordCount: dept.recordCount || 0,
      earliestDate: dept.earliestDate || null,
      latestDate: dept.latestDate || null
    };
    return acc;
  }, {});

  // Normalize trend data
  const trend = rawData.trend || {};
  const dailyTrend = Array.isArray(trend.daily) ? trend.daily : [];

  // Normalize drilldown data
  const drilldown = rawData.drilldown || {};
  const services = Array.isArray(drilldown.services) ? drilldown.services : [];
  const resources = Array.isArray(drilldown.resources) ? drilldown.resources : [];

  return {
    overview: {
      departments,
      totalCost: overview.totalCost || 0,
      departmentMetrics
    },
    trend: {
      daily: dailyTrend,
      totalTrendCost: trend.totalCost || 0
    },
    drilldown: {
      services,
      resources
    },
    metadata: {
      isEmptyState: departments.length === 0 && 
                   dailyTrend.length === 0 &&
                   services.length === 0 &&
                   resources.length === 0
    }
  };
};
