import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export function useDashboardRoute() {
  const location = useLocation();

  return useMemo(() => {
    const path = location.pathname;

    const isDataExplorer = path.includes('/data-explorer');
    const isCostAnalysis = path.includes('/cost-analysis');
    const isCostDrivers = path.includes('/cost-drivers');
    const isDataQuality = path.includes('/data-quality');
    const isForecastingBudgets = path.includes('/forecasting-budgets');
    const isAlertsIncidents = path.includes('/alerts-incidents');
    const isOptimization = path.includes('/optimization');
    const isReports = path.includes('/reports');
    const isAllocationUnitEconomics = path.includes('/allocation-unit-economics');

    const isOverview =
      !isDataExplorer &&
      !isCostAnalysis &&
      !isCostDrivers &&
      !isDataQuality &&
      !isForecastingBudgets &&
      !isAlertsIncidents &&
      !isOptimization &&
      !isReports &&
      !isAllocationUnitEconomics;

    return {
      pathname: path,
      isDataExplorer,
      isCostAnalysis,
      isCostDrivers,
      isDataQuality,
      isForecastingBudgets,
      isAlertsIncidents,
      isOptimization,
      isReports,
      isAllocationUnitEconomics,
      isOverview,
    };
  }, [location.pathname]);
}
