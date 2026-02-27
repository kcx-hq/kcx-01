import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type {
  IdleFilter,
  IdleResource,
  IdleSort,
  Opportunity,
  OptimizationData,
  OptimizationFilters,
  OptimizationTab,
  RightSizingRecommendation,
} from "../../../core-dashboard/optimization/types";

export type {
  IdleFilter,
  IdleResource,
  IdleSort,
  Opportunity,
  OptimizationData,
  OptimizationFilters,
  OptimizationTab,
  RightSizingRecommendation,
};

export interface OptimizationProps {
  filters?: OptimizationFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface RecommendationRaw {
  id?: string;
  resourceName?: string;
  resourceId?: string;
  name?: string;
  category?: string;
  type?: string;
  confidence?: string;
  potentialSavings?: number;
  savings?: number;
  monthlyCost?: number;
  currentMonthlyCost?: number;
  recommendation?: string;
  whyFlagged?: string;
  tags?: string[];
  region?: string;
  risk?: string;
  [key: string]: unknown;
}

export interface OptimizationSummaryPayload {
  summary?: Record<string, unknown> | null;
  recommendations?: RecommendationRaw[];
  byCategory?: Record<string, unknown>;
}

export interface OptimizationIdlePayload {
  idleResources?: IdleResource[];
  summary?: Record<string, unknown> | null;
}

export interface OptimizationRightSizingPayload {
  recommendations?: RightSizingRecommendation[];
  summary?: Record<string, unknown> | null;
}

export interface OptimizationDataExtended extends OptimizationData {
  summary?: Record<string, unknown> | null;
  byCategory?: Record<string, unknown>;
  idleSummary?: Record<string, unknown> | null;
  rightSizingSummary?: Record<string, unknown> | null;
  commitments?: Record<string, unknown> | null;
}

export interface UseOptimizationDataParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  parentFilters: OptimizationFilters;
}

export interface UseOptimizationDataResult {
  optimizationData: OptimizationDataExtended | null;
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  refetch: () => Promise<void>;
}

export interface OptimizationModuleCaps {
  enabled?: boolean;
  endpoints?: {
    summary?: unknown;
    idleResources?: unknown;
    rightSizing?: unknown;
    commitments?: unknown;
    [key: string]: unknown;
  };
}

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
