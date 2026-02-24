import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export function useDashboardRoute() {
  const location = useLocation();

  return useMemo(() => {
    const path = location.pathname;

    const isDataExplorer = path.includes('/data-explorer');
    const isCostAnalysis = path.includes('/cost-analysis');
    const isCostDrivers = path.includes('/cost-drivers');
    const isResources = path.includes('/resources');
    const isDataQuality = path.includes('/data-quality');
    const isOptimization = path.includes('/optimization');
    const isReports = path.includes('/reports');
    const isAccounts = path.includes('/accounts');
    const isAllocationUnitEconomics = path.includes('/allocation-unit-economics');

    const isOverview =
      !isDataExplorer &&
      !isCostAnalysis &&
      !isCostDrivers &&
      !isResources &&
      !isDataQuality &&
      !isOptimization &&
      !isReports &&
      !isAccounts &&
      !isAllocationUnitEconomics;

    return {
      pathname: path,
      isDataExplorer,
      isCostAnalysis,
      isCostDrivers,
      isResources,
      isDataQuality,
      isOptimization,
      isReports,
      isAccounts,
      isAllocationUnitEconomics,
      isOverview,
    };
  }, [location.pathname]);
}
