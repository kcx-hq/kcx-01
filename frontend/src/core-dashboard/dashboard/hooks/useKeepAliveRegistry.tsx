import { useEffect, useRef } from 'react';
import type { DashboardRouteFlags } from '../types';

export function useKeepAliveRegistry(routeFlags: DashboardRouteFlags) {
  const loadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const map: Array<[string, boolean]> = [
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

  const shouldRender = (isActive: boolean, componentName: string) =>
    isActive || loadedRef.current.has(componentName);

  return { shouldRender };
}



