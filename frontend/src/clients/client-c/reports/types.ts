import type { LucideIcon } from "lucide-react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";

export type ReportColor = "blue" | "mint" | "green" | "orange" | "red" | "indigo" | "yellow";

export interface ReportsMetricItem {
  name: string;
  value?: number;
  cost?: number;
  percentage?: number;
}

export interface ReportsSummary {
  totalSpend: number;
  forecast: number;
  spendChangePercent: number;
  avgDailySpend: number;
  dailyData: Record<string, unknown>[];
  topService: ReportsMetricItem;
  topRegion: ReportsMetricItem;
  taggedCost: number;
  untaggedCost: number;
  prodCost: number;
  nonProdCost: number;
  billingPeriod: string;
  taggedPercent: number;
  prodPercent: number;
  departmentSplit: Record<string, unknown>[];
}

export interface ReportsTopServices {
  topServices: ReportsMetricItem[];
  topRegions: ReportsMetricItem[];
}

export interface ReportsMonthlySpend {
  monthlyData: Record<string, unknown>[];
}

export interface ReportsData {
  summary: ReportsSummary;
  topServices: ReportsTopServices;
  monthlySpend: ReportsMonthlySpend;
}

export interface ReportsExtractedData extends ReportsData {
  metadata: {
    isEmptyState: boolean;
  };
}

export interface ReportDefinition {
  id: string;
  title: string;
  icon: LucideIcon;
  frequency: string;
  period: string;
  includes: string[];
  description: string;
  color: ReportColor;
}

export interface DownloadReportItem {
  name: string;
  cost: number;
}

export interface DownloadReportPayload {
  reportType: string;
  period: string;
  totalSpend: number;
  topServices: DownloadReportItem[];
  topRegions: DownloadReportItem[];
  optimizationData: {
    totalPotentialSavings: number;
    highConfidencePercent: number;
    underReviewPercent: number;
    idleResources: number;
    rightSizing: number;
    commitments: number;
  };
  topServicePercent: number;
  taggedPercent: number;
  prodPercent: number;
}

export interface ClientCReportsProps {
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface ReportsApiResponse<TData> {
  success?: boolean;
  data?: TData;
}

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
