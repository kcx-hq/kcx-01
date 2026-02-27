import type { LucideIcon } from "lucide-react";
import type { ApiClient, Capabilities } from "../../services/apiClient";
import type { DashboardFilters } from "../dashboard/types";

export type ReportType =
  | "executive-cost-summary"
  | "optimization-impact"
  | "risk-predictability"
  | "governance-accountability";

export type ReportColor = "blue" | "green" | "amber" | "teal" | "mint" | "yellow";

export interface ReportMetricItem {
  name?: string;
  value?: number | string;
  cost?: number | string;
}

export interface ReportsSummaryData {
  billingPeriod?: string;
  totalSpend?: number | string;
  topServices?: ReportMetricItem[];
  topRegions?: ReportMetricItem[];
  taggedPercent?: number | string;
  prodPercent?: number | string;
  [key: string]: unknown;
}

export interface ReportsOptimizationData {
  idleResources?: unknown[];
  rightSizingRecommendations?: unknown[];
  underutilizedServices?: unknown[];
  totalPotentialSavings?: number | string;
  [key: string]: unknown;
}

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
  reportData: ReportsSummaryData | null;
  optimizationData: ReportsOptimizationData | null;
}

export interface ReportDefinition {
  id: ReportType;
  title: string;
  icon: LucideIcon;
  frequency: string;
  period: string;
  includes: string[];
  description: string;
  color: ReportColor;
  isLocked: boolean;
}

export interface ReportsViewProps {
  fetchingData: boolean;
  reports: ReportDefinition[];
  onDownloadReport: (reportType: ReportType) => Promise<void>;
  downloading: boolean;
  canDownload: boolean;
  title?: string;
  subtitle?: string;
}

export interface ReportCardProps {
  report: ReportDefinition;
  index: number;
  onDownload: (reportType: ReportType) => Promise<void>;
  downloading: boolean;
  canDownload: boolean;
}

export interface LoadingStateProps {
  label?: string;
}

export interface ComingSoonReportItem {
  title: string;
  description: string;
  icon: LucideIcon;
  color: ReportColor;
}

export interface DownloadReportItem {
  name: string;
  cost: number;
}

export interface DownloadReportPayload {
  reportType: ReportType;
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

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
