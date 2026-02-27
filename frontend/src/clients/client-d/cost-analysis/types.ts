import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { DashboardFilters } from "../../../core-dashboard/dashboard/types";

export interface CostFilters {
  provider: string;
  service: string;
  region: string;
}

export type CostChartType = "area" | "bar" | "line";
export type CostModalType = "breakdown" | "average" | "peak" | "trend" | null;

export interface CostKpis {
  totalSpend: number;
  avgDaily: number;
  peakUsage: number;
  trend: number;
  peakDate?: string;
  [key: string]: string | number | undefined;
}

export interface CostChartRow {
  date?: string;
  total?: number;
  [key: string]: string | number | undefined;
}

export interface CostBreakdownItem {
  name?: string;
  value?: number;
  [key: string]: unknown;
}

export interface CostAnalysisApiData {
  kpis?: Partial<CostKpis>;
  dailyTrends?: CostChartRow[];
  breakdown?: CostBreakdownItem[];
  [key: string]: unknown;
}

export interface CostAnalysisProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters?: DashboardFilters;
  onFilterChange?: (partial: Partial<DashboardFilters>) => void;
}

export interface CostAnalysisViewProps {
  children?: ReactNode;
  isLocked: boolean;
  activeTab: string;
  chartType: CostChartType;
  setChartType: Dispatch<SetStateAction<CostChartType>>;
  hiddenSeries: Set<string>;
  toggleSeries: (key: string) => void;
  apiData: CostAnalysisApiData | null;
  kpis: CostKpis;
  chartData: CostChartRow[];
  activeKeys: string[];
  breakdown: CostBreakdownItem[];
  activeModal: CostModalType;
  setActiveModal: Dispatch<SetStateAction<CostModalType>>;
}

export interface UseCostAnalysisParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: CostFilters;
  groupBy: string;
}

export interface UseCostAnalysisResult {
  loading: boolean;
  isRefreshing: boolean;
  apiData: CostAnalysisApiData | null;
  error: string | null;
}

export interface CostFilterOptions {
  providers?: string[];
  services?: string[];
  regions?: string[];
  [key: string]: unknown;
}

export interface UseCostFiltersParams {
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface UseCostFiltersResult {
  filterOptions: CostFilterOptions;
}

export interface KpiCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  subValue?: string;
  onClick?: () => void;
  trend?: number;
}

export interface TooltipPayloadEntry {
  name?: string;
  value?: number;
  color?: string;
  payload?: Record<string, unknown>;
}

export interface SpendBehaviorCardProps {
  isLocked: boolean;
  chartType: CostChartType;
  setChartType: Dispatch<SetStateAction<CostChartType>>;
  chartData: CostChartRow[];
  activeKeys: string[];
  hiddenSeries: Set<string>;
}

export interface BreakdownSidebarProps {
  isLocked: boolean;
  breakdown: CostBreakdownItem[];
  hiddenSeries: Set<string>;
  toggleSeries: (name: string) => void;
  totalSpend: number;
}

export interface BreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: CostBreakdownItem[];
}

export interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  date?: string;
  highlight?: string;
}

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
  response?: {
    status?: number;
  };
}
