import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { DashboardFilters } from "../../../core-dashboard/dashboard/types";
import type {
  ApiLikeError as CoreApiLikeError,
  ReportColor,
  ReportDefinition as CoreReportDefinition,
} from "../../../core-dashboard/reports/types";

export interface ReportMetricItem {
  name?: string;
  value?: number | string;
  cost?: number | string;
  percentage?: number | string;
}

export interface DailyReportPoint {
  date?: string;
  cost?: number;
  [key: string]: unknown;
}

export interface ClientDReportData {
  billingPeriod?: string;
  totalSpend?: number;
  forecast?: number;
  avgDailySpend?: number;
  topRegion?: ReportMetricItem;
  taggedCost?: number;
  untaggedCost?: number;
  prodCost?: number;
  nonProdCost?: number;
  taggedPercent?: number;
  untaggedPercent?: number;
  prodPercent?: number;
  nonProdPercent?: number;
  dailyData?: DailyReportPoint[];
  topServices?: ReportMetricItem[];
  topRegions?: ReportMetricItem[];
  [key: string]: unknown;
}

export type ReportDefinition = CoreReportDefinition;

export interface ReportsProps {
  filters?: Partial<DashboardFilters>;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface UseReportsDataParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: Partial<DashboardFilters>;
}

export interface UseReportsDataResult {
  fetchingData: boolean;
  reportData: ClientDReportData | null;
}

export interface ReportsApiResponse<TData> {
  success?: boolean;
  data?: TData | ReportsApiResponse<TData> | null;
}

export interface ReportsViewProps {
  fetchingData: boolean;
  isLocked: boolean;
  reportData: ClientDReportData | null;
  canDownload?: boolean;
  reports?: ReportDefinition[];
}

export interface PanelProps {
  title: string;
  children: ReactNode;
}

export interface MiniStatProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export interface BarRowProps {
  name: string | undefined;
  value: number | string | undefined;
  percentage: number | string | undefined;
}

export interface SplitBarProps {
  leftLabel: string;
  leftPct: number | string | undefined;
  rightLabel: string;
  rightPct: number | string | undefined;
}

export type ApiLikeError = CoreApiLikeError;
export type ReportsDefinitionColor = ReportColor;
