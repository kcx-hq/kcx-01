import type { ChangeEvent, Dispatch, MouseEvent, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
import type { ApiClient, Capabilities } from "../../services/apiClient";
import type { DashboardFilters } from "../dashboard/types";

export type OptimizationTab = "opportunities" | "idle" | "rightsizing" | "commitments";
export type IdleFilter = "all" | "prod" | "non-prod";
export type IdleSort = "savings-desc" | "savings-asc" | "days-desc" | "days-asc";

export interface OptimizationFilters extends Partial<DashboardFilters> {
  [key: string]: string | undefined;
}

export interface IdleResource {
  id: string;
  name: string;
  type: string;
  region?: string;
  risk?: "Prod" | "Non-prod" | string;
  status?: string;
  daysIdle?: number;
  utilization?: string;
  utilizationSignal?: string;
  lastActivity?: string;
  savings?: number;
  confidence?: "High" | "Medium" | "Low" | string;
  whyFlagged?: string;
  typicalResolutionPaths?: string[];
  serviceSpendPercent?: number;
  regionSpendPercent?: number;
}

export interface Opportunity {
  id?: string;
  type?: "opportunity" | string;
  title?: string;
  description?: string;
  priority?: "HIGH IMPACT" | "MEDIUM IMPACT" | "LOW IMPACT" | string;
  savings?: number;
  confidence?: string;
  regions?: string[] | string;
  evidence?: string[];
  costImpact?: {
    current?: number;
    optimized?: number;
  };
}

export interface RightSizingRecommendation {
  id: string;
  type?: "rightsizing" | string;
  title?: string;
  currentInstance?: string;
  currentCPU?: number;
  currentCost?: number;
  recommendedInstance?: string;
  recommendedCost?: number;
  savings?: number;
  riskLevel?: "Low" | "Medium" | "High" | string;
  assumptions?: string[];
}

export interface OptimizationData {
  opportunities: Opportunity[];
  idleResources: IdleResource[];
  rightSizingRecs: RightSizingRecommendation[];
  totalPotentialSavings: number;
}

export interface OptimizationProps {
  filters?: OptimizationFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface UseOptimizationDataParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  parentFilters: OptimizationFilters;
}

export interface UseOptimizationDataResult {
  optimizationData: OptimizationData | null;
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  refetch: () => Promise<void>;
}

export interface OptimizationTabItem {
  id: OptimizationTab;
  label: string;
  icon: LucideIcon;
}

export interface OptimizationViewProps {
  isMasked: boolean;
  activeTab: OptimizationTab;
  setActiveTab: Dispatch<SetStateAction<OptimizationTab>>;
  expandedItems: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  selectedInsight: Opportunity | RightSizingRecommendation | null;
  setSelectedInsight: Dispatch<SetStateAction<Opportunity | RightSizingRecommendation | null>>;
  selectedResource: IdleResource | null;
  setSelectedResource: Dispatch<SetStateAction<IdleResource | null>>;
  idleFilter: IdleFilter;
  setIdleFilter: Dispatch<SetStateAction<IdleFilter>>;
  idleSort: IdleSort;
  setIdleSort: Dispatch<SetStateAction<IdleSort>>;
  idleSearch: string;
  setIdleSearch: Dispatch<SetStateAction<string>>;
  filteredIdleResources: IdleResource[];
  optimizationData: OptimizationData | null;
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  onRetry: () => Promise<void>;
}

export interface TabsProps {
  activeTab: OptimizationTab;
  onChange: Dispatch<SetStateAction<OptimizationTab>>;
  tabs: OptimizationTabItem[];
}

export interface OpportunitiesTabProps {
  opportunities?: Opportunity[];
  onSelectInsight?: (insight: Opportunity) => void;
}

export interface RightSizingTabProps {
  rightSizingRecs?: RightSizingRecommendation[];
  onSelectInsight?: (insight: RightSizingRecommendation) => void;
}

export interface IdleResourcesTabProps {
  idleResources?: IdleResource[];
  filteredIdleResources?: IdleResource[];
  expandedItems?: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  idleSearch: string;
  setIdleSearch: Dispatch<SetStateAction<string>>;
  idleFilter: IdleFilter;
  setIdleFilter: Dispatch<SetStateAction<IdleFilter>>;
  idleSort: IdleSort;
  setIdleSort: Dispatch<SetStateAction<IdleSort>>;
}

export interface InsightModalProps {
  selectedInsight: (Opportunity | RightSizingRecommendation) | null;
  onClose: () => void;
}

export interface ResourceSidePanelProps {
  selectedResource: IdleResource | null;
  onClose: () => void;
}

export type OptimizationInputChange = ChangeEvent<HTMLInputElement>;
export type OptimizationSelectChange = ChangeEvent<HTMLSelectElement>;
export type OptimizationDivClick = MouseEvent<HTMLDivElement>;

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
