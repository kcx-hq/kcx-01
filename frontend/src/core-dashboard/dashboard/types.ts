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

export interface DashboardHeaderAlert {
  id: string;
  title: string;
  category: string;
  type: string;
  subtype: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  detectedAt: string;
  deepLink: string;
  scope: {
    provider: string;
    service: string;
    region: string;
    team: string;
  };
  impact: {
    amount: number;
    pct: number;
    currency: string;
  };
  nextStep: string;
}

export interface DashboardHeaderAlertsData {
  totalOpenAlerts: number;
  categories: Array<{ id: string; label: string; count: number }>;
  topByCategory: Record<string, DashboardHeaderAlert[]>;
  topAlerts: DashboardHeaderAlert[];
  currency: string;
}

export interface DashboardHeaderData {
  anomalies: DashboardAnomaliesData;
  alerts: DashboardHeaderAlertsData;
}

export interface HeaderAnomaliesParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: DashboardFilters;
  route: DashboardRouteFlags;
}
