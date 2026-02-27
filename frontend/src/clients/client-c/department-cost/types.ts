import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { DashboardFilters } from "../../../core-dashboard/dashboard/types";

export type NumericValue = number | string;

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}

export interface DepartmentCostFilters extends DashboardFilters {
  department?: string;
  uploadId?: string;
}

export interface DepartmentCostFilterOptions {
  providers: string[];
  services: string[];
  regions: string[];
  departments: string[];
}

export interface DepartmentMetric {
  totalCost: number;
  percentage: number;
  recordCount: number;
  earliestDate: string | null;
  latestDate: string | null;
}

export interface DepartmentOverviewItem {
  name: string;
  totalCost: number;
  percentage: number;
  recordCount: number;
  earliestDate: string | null;
  latestDate: string | null;
}

export interface DepartmentTrendPoint {
  date: string;
  cost: number;
  totalCost?: number;
}

export interface DepartmentServiceCost {
  name: string;
  cost: number;
}

export interface DepartmentResourceCost {
  resourceId: string;
  cost: number;
}

export interface DepartmentOverviewData {
  totalCost?: number;
  departmentCount?: number;
  topDepartment?: string;
  departments?: DepartmentOverviewItem[];
}

export interface DepartmentCostOverview {
  departments: DepartmentOverviewItem[];
  totalCost: number;
  departmentMetrics: Record<string, DepartmentMetric>;
}

export interface DepartmentCostTrend {
  daily: DepartmentTrendPoint[];
  totalTrendCost: number;
}

export interface DepartmentCostDrilldown {
  services: DepartmentServiceCost[];
  resources: DepartmentResourceCost[];
}

export interface NormalizedDepartmentCostData {
  overview: DepartmentCostOverview;
  trend: DepartmentCostTrend;
  drilldown: DepartmentCostDrilldown;
  metadata: {
    isEmptyState: boolean;
  };
}

export interface DepartmentCostSourceData {
  overview?: {
    departments?: DepartmentOverviewItem[];
    totalCost?: number;
  };
  trend?: {
    daily?: DepartmentTrendPoint[];
    totalCost?: number;
  };
  drilldown?: {
    services?: DepartmentServiceCost[];
    resources?: DepartmentResourceCost[];
  };
}

export interface DepartmentCostResponseEnvelope<TData> {
  success?: boolean;
  data?: TData;
}

export interface ClientCDepartmentCostProps {
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface LegacyDepartmentCostProps extends ClientCDepartmentCostProps {
  filters: DepartmentCostFilters;
  uploadId?: string | null;
}

export interface UseClientCDepartmentCostDataResult {
  departmentData: DepartmentCostSourceData | null;
  loading: boolean;
  error: string | null;
  isFiltering: boolean;
}

export interface UseClientCDepartmentCostFiltersResult {
  filterOptions: DepartmentCostFilterOptions;
  loading: boolean;
  error: string | null;
}

export interface ClientCDepartmentCostViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  loading: boolean;
  departmentData: DepartmentCostSourceData | null;
  extractedData: NormalizedDepartmentCostData;
  isEmptyState: boolean;
}
