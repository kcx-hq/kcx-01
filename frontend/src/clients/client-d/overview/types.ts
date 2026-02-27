import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type {
  ApiLikeError as CoreApiLikeError,
  OverviewBillingPeriod,
  OverviewGroupedPoint,
  OverviewTopItem,
} from "../../../core-dashboard/overview/types";

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

export interface OverviewData {
  message?: string;
  totalSpend?: number;
  trendPercentage?: number;
  avgDailySpend?: number;
  billingPeriod?: OverviewBillingPeriod | null;
  dailyData?: Array<{ date?: string; cost?: number }>;
  groupedData?: OverviewGroupedPoint[];
  serviceBreakdown?: OverviewGroupedPoint[];
  allRegionData?: OverviewGroupedPoint[];
  topRegion?: OverviewTopItem;
  topService?: OverviewTopItem;
  topProvider?: OverviewTopItem;
  spendChangePercent?: number;
  untaggedCost?: number;
  missingMetadataCost?: number;
  topRegionPercent?: number;
  topServicePercent?: number;
  [key: string]: unknown;
}

export interface NormalizedOverviewData {
  totalSpend: number;
  trendPercentage: number;
  avgDailySpend: number;
  billingPeriod: OverviewBillingPeriod | null;
  dailyData: Array<{ date: string; cost: number }>;
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
  onFilterChange: (filters: OverviewFilters) => void;
  onReset: () => void;
  loading: boolean;
  isFiltering: boolean;
  overviewData: OverviewData | null;
  extractedData: NormalizedOverviewData;
  filteredGroupedData: OverviewGroupedPoint[];
  chartFilters: OverviewChartFilters;
  onTrendLimitChange: (limit: number) => void;
  onBarLimitChange: (limit: number) => void;
  isLocked: boolean;
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
  data?: (OverviewFilterOptions & { data?: OverviewFilterOptions }) | null;
}

export interface OverviewDataApiResponse {
  success?: boolean;
  data?: (OverviewData & { data?: OverviewData }) | null;
}

export interface OverviewKpiGridProps {
  extractedData: NormalizedOverviewData;
  locked?: boolean;
}

export interface KpiInsightMetric {
  label: string;
  value: string;
}

export interface KpiInsight {
  title: string;
  description: string;
  metrics: KpiInsightMetric[];
  recommendation?: string;
}

export type KpiInsightId = "totalSpend" | "avgDailySpend" | "topService" | string;
export type KpiInsightContext = NormalizedOverviewData;

export type ApiLikeError = CoreApiLikeError;
export type { OverviewGroupedPoint };
