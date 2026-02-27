import type { ApiClient, ApiCallOptions, Capabilities } from "../../../services/apiClient";

export interface OverviewFilters {
  provider: string;
  service: string;
  region: string;
}

export interface OverviewFilterOptions {
  providers: string[];
  services: string[];
  regions: string[];
}

export interface OverviewTopItem {
  name: string;
  value: number;
}

export interface OverviewBillingPeriod {
  start?: string;
  end?: string;
}

export interface OverviewDailyPoint {
  date: string;
  cost: number;
}

export interface OverviewGroupedPoint {
  name: string;
  value: number;
}

export interface DepartmentBreakdownItem {
  name: string;
  value: number;
  percentage: number;
}

export interface OverviewData {
  message?: string;
  totalSpend?: number;
  trendPercentage?: number;
  avgDailySpend?: number;
  billingPeriod?: OverviewBillingPeriod | null;
  dailyData?: OverviewDailyPoint[];
  groupedData?: OverviewGroupedPoint[];
  allRegionData?: OverviewGroupedPoint[];
  topRegion?: OverviewTopItem;
  topService?: OverviewTopItem;
  topProvider?: OverviewTopItem;
  spendChangePercent?: number;
  untaggedCost?: number;
  missingMetadataCost?: number;
  topRegionPercent?: number;
  topServicePercent?: number;
  departmentBreakdown?: DepartmentBreakdownItem[];
  departmentTrends?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface NormalizedOverviewData {
  totalSpend: number;
  trendPercentage: number;
  avgDailySpend: number;
  billingPeriod: OverviewBillingPeriod | null;
  dailyData: OverviewDailyPoint[];
  groupedData: OverviewGroupedPoint[];
  allRegionData: OverviewGroupedPoint[];
  topRegion: OverviewTopItem;
  topService: OverviewTopItem;
  topProvider: OverviewTopItem;
  spendChangePercent: number;
  untaggedCost: number;
  missingMetadataCost: number;
  topRegionPercent: number;
  topServicePercent: number;
  departmentBreakdown: DepartmentBreakdownItem[];
  departmentTrends: Record<string, unknown>[];
}

export interface OverviewChartFilters {
  trendChart: { limit: number };
  pieChart: { limit: number };
  barChart: { limit: number };
}

export interface OverviewProps {
  onFilterChange?: (filters: Partial<OverviewFilters>) => void;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface OverviewViewProps {
  filters: OverviewFilters;
  filterOptions: OverviewFilterOptions;
  onFilterChange: (filters: Partial<OverviewFilters>) => void;
  onReset: () => void;
  loading: boolean;
  isFiltering: boolean;
  overviewData: OverviewData | null;
  extractedData: NormalizedOverviewData;
  filteredGroupedData: OverviewGroupedPoint[];
  chartFilters: OverviewChartFilters;
  onTrendLimitChange: (limit: number) => void;
  onBarLimitChange: (limit: number) => void;
}

export interface UseOverviewDataResult {
  overviewData: OverviewData | null;
  loading: boolean;
  isFiltering: boolean;
}

export interface UseOverviewFiltersResult {
  filterOptions: OverviewFilterOptions;
}

export interface OverviewFiltersApiResponse {
  success?: boolean;
  data?: {
    data?: OverviewFilterOptions;
    providers?: string[];
    services?: string[];
    regions?: string[];
  };
}

export interface OverviewDataApiResponse {
  success?: boolean;
  data?: OverviewData;
}

export type ClientCApiCallOptions = ApiCallOptions & {
  signal?: AbortSignal;
};

export interface OverviewStatesProps {
  type: "loading" | "noUpload" | "empty";
}

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
