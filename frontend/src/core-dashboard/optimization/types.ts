import type { ChangeEvent, Dispatch, MouseEvent, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
import type { ApiClient, Capabilities } from "../../services/apiClient";
import type { DashboardFilters } from "../dashboard/types";

export type OptimizationTab =
  | "overview"
  | "execution-backlog"
  | "commitments-rates"
  | "opportunities"
  | "idle"
  | "rightsizing"
  | "commitments";
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
  region?: string;
  resourceName?: string;
}

export interface CommitmentGap {
  onDemandPercentage?: number;
  coveragePct?: number;
  utilizationPct?: number;
  effectiveSavingsRatePct?: number;
  breakageRiskPct?: number;
  totalComputeSpend?: number;
  onDemandSpend?: number;
  committedSpend?: number;
  recommendation?: string;
  potentialSavings?: number;
  predictableWorkload?: boolean;
  workloadPattern?: string;
  typicalApproach?: string;
  commitmentMix?: {
    committedSpend?: number;
    onDemandSpend?: number;
    committedPct?: number;
    onDemandPct?: number;
  };
  expiryWindows?: Array<{
    window?: string;
    exposure?: number;
    riskState?: string;
  }>;
  [key: string]: unknown;
}

export interface ActionCenterExecutionKpis {
  openCount?: number;
  estimatedMonthlySavings?: number;
  verifiedMtd?: number;
  blockedCount?: number;
  generatedAt?: string;
}

export interface ActionCenterBacklogRow {
  id?: string;
  title?: string;
  owner?: string;
  impact?: number;
  confidence?: string;
  effort?: string;
  status?: string;
  eta?: string;
  blockedBy?: string;
  score?: number;
}

export interface ActionCenterWorkflowRow {
  id?: string;
  title?: string;
  owner?: string;
  status?: string;
  eta?: string;
  blockedBy?: string;
  nextStep?: string;
}

export interface ActionCenterVerificationRow {
  id?: string;
  title?: string;
  claimed?: number;
  verified?: number;
  delta?: number;
}

export interface ActionCenterIdleRow {
  id?: string;
  name?: string;
  type?: string;
  env?: string;
  age?: number;
  last?: string;
  savings?: number;
  confidence?: string;
}

export interface ActionCenterWasteRow {
  id?: string;
  label?: string;
  savings?: number;
  rule?: string;
  ruleName?: string;
}

export interface ActionCenterRightsizingRow {
  id?: string;
  current?: string;
  recommended?: string;
  cpuP95Pct?: number;
  savings?: number;
  risk?: string;
}

export interface ActionCenterExecutionModel {
  kpis?: ActionCenterExecutionKpis;
  backlogRows?: ActionCenterBacklogRow[];
  workflowRows?: ActionCenterWorkflowRow[];
  verificationRows?: ActionCenterVerificationRow[];
  wasteCategories?: ActionCenterWasteRow[];
  rightsizingRows?: ActionCenterRightsizingRow[];
  idleRows?: ActionCenterIdleRow[];
  storageRows?: ActionCenterIdleRow[];
}

export interface ActionCenterCommitmentsKpis {
  coveragePct?: number;
  utilizationPct?: number;
  effectiveSavingsRatePct?: number;
  onDemandPct?: number;
  totalComputeSpend?: number;
  potentialSavings?: number;
  underCoveredPct?: number;
  overCoveredPct?: number;
  breakageRiskPct?: number;
}

export interface ActionCenterCommitmentExpirationRow {
  window?: string;
  expiresOn?: string;
  exposure?: number;
  riskState?: string;
}

export interface ActionCenterCommitmentDecisionRow {
  id?: string;
  scope?: string;
  action?: string;
  rationale?: string;
  projectedSavings?: number;
  downsideRiskPct?: number;
  risk?: string;
  confidence?: string;
}

export interface ActionCenterCommitmentDrilldownRow {
  scope?: string;
  covered?: number;
  committed?: number;
  utilized?: number;
  unused?: number;
}

export interface ActionCenterCommitmentModel {
  summary?: {
    recommendation?: string;
    predictableWorkload?: boolean;
    workloadPattern?: string;
    typicalApproach?: string;
  };
  kpis?: ActionCenterCommitmentsKpis;
  expirationRows?: ActionCenterCommitmentExpirationRow[];
  riskCards?: Array<{
    id?: string;
    label?: string;
    value?: number;
  }>;
  decisionRows?: ActionCenterCommitmentDecisionRow[];
  drilldownRows?: ActionCenterCommitmentDrilldownRow[];
}

export interface ActionCenterModel {
  opportunities?: Record<string, unknown>[];
  verificationRows?: Record<string, unknown>[];
  wasteCategories?: Record<string, unknown>[];
  executive?: {
    realizedSavingsMtd?: number;
    [key: string]: unknown;
  };
  commitment?: CommitmentGap;
  execution?: ActionCenterExecutionModel;
  commitments?: ActionCenterCommitmentModel;
  meta?: {
    generatedAt?: string;
    formulaVersion?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface OptimizationData {
  opportunities: Opportunity[];
  idleResources: IdleResource[];
  rightSizingRecs: RightSizingRecommendation[];
  totalPotentialSavings: number;
  actionCenterModel?: ActionCenterModel | null;
  commitmentGap?: CommitmentGap | null;
  trackerItems?: Record<string, unknown>[];
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
