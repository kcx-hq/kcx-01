import type { ApiClient, Capabilities } from "../../services/apiClient";

export interface DashboardFilters {
  provider: string;
  service: string;
  region: string;
  uploadId?: string;
  [key: string]: string | undefined;
}

export interface DashboardRouteFlags {
  pathname: string;
  isDataExplorer: boolean;
  isCostAnalysis: boolean;
  isCostDrivers: boolean;
  isResources: boolean;
  isDataQuality: boolean;
  isOptimization: boolean;
  isReports: boolean;
  isAccounts: boolean;
  isOverview: boolean;
}

export interface DashboardAnomaly {
  ServiceName?: string;
  ProviderName?: string;
  RegionName?: string;
  cost?: number;
  ChargePeriodStart?: string;
}

export interface DashboardAnomaliesData {
  list: DashboardAnomaly[];
  count: number;
}

export interface HeaderAnomaliesParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: DashboardFilters;
  route: DashboardRouteFlags;
}
