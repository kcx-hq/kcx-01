import { useMemo } from 'react';

export function isModuleEnabled(caps, moduleKey) {
  return caps?.modules?.[moduleKey]?.enabled === true;
}

export function hasEndpoint(caps, moduleKey, endpointKey) {
  return !!caps?.modules?.[moduleKey]?.endpoints?.[endpointKey];
}

export function useDashboardCapabilities(caps) {
  const hasAnyDashboardModule = useMemo(() => {
    if (!caps) return false;
    return (
      isModuleEnabled(caps, 'overview') ||
      isModuleEnabled(caps, 'costAnalysis') ||
      isModuleEnabled(caps, 'costDrivers') ||
      isModuleEnabled(caps, 'dataQuality') ||
      isModuleEnabled(caps, 'forecastingBudgets') ||
      isModuleEnabled(caps, 'alertsIncidents') ||
      isModuleEnabled(caps, 'optimization') ||
      isModuleEnabled(caps, 'reports') ||
      isModuleEnabled(caps, 'governance') ||
      isModuleEnabled(caps, 'unitEconomics')
    );
  }, [caps]);

  return { hasAnyDashboardModule };
}
