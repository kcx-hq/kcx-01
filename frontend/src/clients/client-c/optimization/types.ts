import type { Dispatch, SetStateAction } from "react";
import type { ApiClient, ApiCallOptions, Capabilities } from "../../../services/apiClient";
import type { IdleFilter, IdleSort, OptimizationTab } from "../../../core-dashboard/optimization/types";

export type { IdleFilter, IdleSort, OptimizationTab };

export interface ClientCOptimizationFilters {
  provider: string;
  service: string;
  region: string;
  uploadId: string | null;
}

export interface ClientCOptimizationFilterOptions {
  providers: string[];
  services: string[];
  regions: string[];
}

export interface ClientCOptimizationProps {
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface ClientCOptimizationRawItem {
  id?: string;
  resourceId?: string;
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  savings?: number | string;
  monthlySavings?: number | string;
  category?: string;
  type?: string;
  priority?: string;
  status?: string;
  source?: string;
  resourceName?: string;
  resourceType?: string;
  provider?: string;
  region?: string;
  daysIdle?: number | string;
  environment?: string;
  risk?: string;
  tags?: string[];
  currentSize?: string;
  currentInstanceType?: string;
  recommendedSize?: string;
  recommendedInstanceType?: string;
  potentialSavings?: number | string;
  cpuUtilization?: number | string;
  cpuAvg?: number | string;
  memoryUtilization?: number | string;
  memoryAvg?: number | string;
  recommendationType?: string;
  [key: string]: unknown;
}

export interface ClientCOpportunity {
  id: string;
  title: string;
  name?: string;
  description: string;
  summary?: string;
  savings: number;
  category: string;
  priority: string;
  type: string;
  status: string;
  source?: string;
}

export interface ClientCIdleResource {
  id: string;
  name: string;
  type: string;
  provider: string;
  region: string;
  savings: number;
  daysIdle: number;
  risk: string;
  status: string;
  tags: string[];
  description: string;
}

export interface ClientCRightSizingRecommendation {
  id: string;
  resourceName: string;
  currentSize: string;
  recommendedSize: string;
  potentialSavings: number;
  cpuUtilization: number;
  memoryUtilization: number;
  resourceType: string;
  recommendationType: string;
}

export interface ClientCOptimizationPayload {
  opportunities: ClientCOptimizationRawItem[];
  recommendations: ClientCOptimizationRawItem[];
  idleResources: ClientCOptimizationRawItem[];
  rightSizingRecs: ClientCOptimizationRawItem[];
  totalPotentialSavings: number;
}

export interface ClientCNormalizedOptimizationData {
  opportunities: ClientCOpportunity[];
  idleResources: ClientCIdleResource[];
  rightSizingRecs: ClientCRightSizingRecommendation[];
  totalPotentialSavings: number;
  metadata: {
    isEmptyState: boolean;
  };
  recommendations?: ClientCOpportunity[];
}

export interface ClientCOptimizationDataResult {
  optimizationData: ClientCOptimizationPayload | null;
  loading: boolean;
  isFiltering: boolean;
  error: string | null;
}

export interface ClientCOptimizationFiltersResult {
  filterOptions: ClientCOptimizationFilterOptions;
  loading: boolean;
  error: string | null;
}

export interface ClientCOptimizationViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: ClientCOptimizationFilters;
  filterOptions: ClientCOptimizationFilterOptions;
  onFilterChange: (newFilters: Partial<ClientCOptimizationFilters>) => void;
  onReset: () => void;
  loading: boolean;
  isFiltering: boolean;
  optimizationData: ClientCOptimizationPayload | null;
  extractedData: ClientCNormalizedOptimizationData;
  isEmptyState: boolean;
  activeTab: OptimizationTab | string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  expandedItems: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  selectedInsight: ClientCOpportunity | null;
  setSelectedInsight: Dispatch<SetStateAction<ClientCOpportunity | null>>;
  selectedResource?: ClientCIdleResource | null;
  setSelectedResource?: Dispatch<SetStateAction<ClientCIdleResource | null>>;
  idleFilter?: IdleFilter | string;
  setIdleFilter?: Dispatch<SetStateAction<string>>;
  idleSort?: IdleSort | string;
  setIdleSort?: Dispatch<SetStateAction<string>>;
  idleSearch?: string;
  setIdleSearch?: Dispatch<SetStateAction<string>>;
  filteredIdleResources?: ClientCIdleResource[];
}

export interface ClientCOptimizationApiResponse<TData> {
  success?: boolean;
  data?: TData;
}

export type ClientCApiCallOptions = ApiCallOptions & {
  signal?: AbortSignal;
};

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
