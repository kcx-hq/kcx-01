import type { ApiClient, ApiCallOptions, Capabilities } from "../../../services/apiClient";

export interface ProjectTrackingFilters {
  provider: string;
  service: string;
  region: string;
  uploadId?: string;
}

export interface ProjectOverviewWidget {
  activeProjects?: number;
  totalBudget?: number;
  totalSpent?: number;
  avgBurnRate?: number;
}

export interface ProjectBudgetComparisonRow {
  project?: string;
  name?: string;
  budget?: number;
  actual?: number;
  remaining?: number;
  budgeted?: number;
  variance?: number;
}

export interface ProjectOverviewItem {
  name: string;
  totalCost: number;
  percentage: number;
  daysActive: number;
  avgDailyCost: number;
  startDate: string | null;
  endDate: string | null;
}

export interface ProjectBurnRatePoint {
  date: string;
  cost: number;
}

export interface ProjectTrackingSourceData {
  overview?: {
    projects?: ProjectOverviewItem[];
    totalCost?: number;
  };
  burnRate?: {
    dailyRates?: ProjectBurnRatePoint[];
    totalRate?: number;
  };
  budgetComparison?: {
    budgets?: ProjectBudgetComparisonRow[];
    comparisons?: ProjectBudgetComparisonRow[];
  };
}

export interface ProjectTrackingExtractedData {
  overview: {
    projects: ProjectOverviewItem[];
    totalCost: number;
    projectMetrics: Record<
      string,
      {
        name: string;
        totalCost: number;
        percentage: number;
        daysActive: number;
        avgDailyCost: number;
        startDate: string | null;
        endDate: string | null;
      }
    >;
  };
  burnRate: {
    dailyRates: ProjectBurnRatePoint[];
    totalRate: number;
  };
  budgetComparison: {
    budgets: ProjectBudgetComparisonRow[];
    comparisons: ProjectBudgetComparisonRow[];
  };
  metadata: {
    isEmptyState: boolean;
  };
}

export interface ProjectTrackingProps {
  filters: ProjectTrackingFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
  uploadId?: string | null;
}

export interface ClientCProjectTrackingProps {
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface ProjectTrackingResponse<TData> {
  success?: boolean;
  data?: TData;
}

export type ProjectTrackingApiCallOptions = ApiCallOptions & {
  signal?: AbortSignal;
};

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
