import type { ChangeEvent } from "react";
import type { LucideIcon } from "lucide-react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";

export type GroupByValue = "ServiceName" | "RegionName" | "ProviderName" | "Department";
export type SpendLevel = "enterprise" | "high" | "moderate" | "low" | "minimal";
export type TrendDirection = "increasing" | "decreasing" | "stable";
export type VolatilityLevel = "high" | "moderate" | "stable";

export interface ClientCCostAnalysisProps {
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface ClientCCostAnalysisFilters {
  provider: string;
  service: string;
  region: string;
  groupBy: GroupByValue;
  uploadId: string | null;
}

export interface ChartLimitConfig {
  limit: number;
}

export interface ClientCCostAnalysisChartFilters {
  trendChart: ChartLimitConfig;
  pieChart: ChartLimitConfig;
  barChart: ChartLimitConfig;
}

export interface GroupByOption {
  value: GroupByValue;
  label: string;
  icon?: string;
}

export interface ClientCCostAnalysisFilterOptions {
  providers: string[];
  services: string[];
  regions: string[];
  groupBy: GroupByOption[];
}

export interface CostKpis {
  totalSpend: number;
  avgDaily: number;
  peakUsage: number;
  peakDate: string | null;
  trend: number;
  atRiskSpend: number;
  forecastTotal: number;
  spendLevel: SpendLevel;
  trendDirection: TrendDirection;
  volatility: VolatilityLevel;
}

export interface CostChartPoint {
  date: string;
  total: number;
  [key: string]: string | number | undefined;
}

export interface CostBreakdownItem {
  name: string;
  value: number;
  label: string;
  percentage: number;
}

export interface CostAnalysisMetadata {
  groupBy: GroupByValue;
  dataPoints: number;
  categories: number;
  totalProcessed: number;
  hasValidData: boolean;
  isEmptyState: boolean;
}

export interface NormalizedCostAnalysisData {
  kpis: CostKpis;
  chartData: CostChartPoint[];
  activeKeys: string[];
  breakdown: CostBreakdownItem[];
  riskData: Record<string, unknown>[];
  anomalies: Record<string, unknown>[];
  drivers: Record<string, unknown>[];
  totalSpend: number;
  avgDaily: number;
  peakUsage: number;
  peakDate: string | null;
  trend: number;
  atRiskSpend: number;
  forecastTotal: number;
  metadata: CostAnalysisMetadata;
  message?: string;
}

export interface RawCostKpis {
  totalSpend?: number | string;
  avgDaily?: number | string;
  peakUsage?: number | string;
  peakDate?: string | null;
  trend?: number | string;
  atRiskSpend?: number | string;
  forecastTotal?: number | string;
  [key: string]: unknown;
}

export interface RawCostChartPoint {
  date?: string;
  total?: number;
  value?: number;
  [key: string]: unknown;
}

export interface RawCostBreakdownItem {
  name?: string;
  label?: string;
  value?: number | string;
  [key: string]: unknown;
}

export interface ClientCCostAnalysisRawData {
  kpis?: RawCostKpis;
  chartData?: RawCostChartPoint[];
  activeKeys?: string[];
  breakdown?: RawCostBreakdownItem[];
  riskData?: Record<string, unknown>[];
  anomalies?: Record<string, unknown>[];
  drivers?: Record<string, unknown>[];
  message?: string;
  [key: string]: unknown;
}

export interface KpiCardConfig {
  id: string;
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  description: string;
  delay: number;
  insights: string;
}

export interface ChartTooltipEntry {
  dataKey?: string;
  color?: string;
  value?: number;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
}

export interface PiePayload {
  name?: string;
  value?: number;
}

export interface PieTooltipEntry {
  payload: PiePayload;
}

export interface PieTooltipProps {
  active?: boolean;
  payload?: PieTooltipEntry[];
}

export interface LegendPayloadValue {
  name: string;
  value: number;
}

export interface LegendPayloadEntry {
  color?: string;
  value: LegendPayloadValue;
}

export interface CustomLegendProps {
  payload?: LegendPayloadEntry[];
}

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}

export interface UseClientCCostAnalysisDataResult {
  costAnalysisData: ClientCCostAnalysisRawData | null;
  loading: boolean;
  isFiltering: boolean;
  error: string | null;
}

export interface UseClientCCostAnalysisFiltersResult {
  filterOptions: ClientCCostAnalysisFilterOptions;
  loading: boolean;
  error: string | null;
}

export interface ClientCCostAnalysisViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: ClientCCostAnalysisFilters;
  filterOptions: ClientCCostAnalysisFilterOptions;
  onFilterChange: (next: Partial<ClientCCostAnalysisFilters>) => void;
  onGroupByChange: (groupBy: GroupByValue) => void;
  onReset: () => void;
  loading: boolean;
  isFiltering: boolean;
  costAnalysisData: ClientCCostAnalysisRawData | null;
  extractedData: NormalizedCostAnalysisData;
  filteredBreakdownData: CostBreakdownItem[];
  chartFilters: ClientCCostAnalysisChartFilters;
  onTrendLimitChange: (limit: number) => void;
  onBarLimitChange: (limit: number) => void;
  isEmptyState: boolean;
}

export type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;
