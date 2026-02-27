import { useMemo } from 'react';
import type { Capabilities, CapabilityModule } from '../../../services/apiClient';

const getModuleConfig = (
  caps: Capabilities | null | undefined,
  moduleKey: string,
): CapabilityModule | undefined => caps?.modules?.[moduleKey];

export function isModuleEnabled(caps: Capabilities | null | undefined, moduleKey: string): boolean {
  return getModuleConfig(caps, moduleKey)?.enabled === true;
}

export function hasEndpoint(
  caps: Capabilities | null | undefined,
  moduleKey: string,
  endpointKey: string,
): boolean {
  return !!getModuleConfig(caps, moduleKey)?.endpoints?.[endpointKey];
}

export function useDashboardCapabilities(caps: Capabilities | null | undefined) {
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



