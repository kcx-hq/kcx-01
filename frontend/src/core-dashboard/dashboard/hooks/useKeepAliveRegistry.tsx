import { useEffect, useRef } from 'react';

export function useKeepAliveRegistry(routeFlags) {
  const loadedRef = useRef(new Set());

  useEffect(() => {
    const map = [
      ['DataExplorer', routeFlags.isDataExplorer],
      ['CostAnalysis', routeFlags.isCostAnalysis],
      ['CostDrivers', routeFlags.isCostDrivers],
      ['DataQuality', routeFlags.isDataQuality],
      ['ForecastingBudgets', routeFlags.isForecastingBudgets],
      ['AlertsIncidents', routeFlags.isAlertsIncidents],
      ['Optimization', routeFlags.isOptimization],
      ['Reports', routeFlags.isReports],
      ['AllocationUnitEconomics', routeFlags.isAllocationUnitEconomics],
      ['Overview', routeFlags.isOverview],
    ];

    map.forEach(([name, isActive]) => {
      if (isActive) loadedRef.current.add(name);
    });
  }, [routeFlags]);

  const shouldRender = (isActive, componentName) =>
    isActive || loadedRef.current.has(componentName);

  return { shouldRender };
}
