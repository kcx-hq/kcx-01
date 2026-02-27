import type { ApiClient, Capabilities } from "../../../services/apiClient";

export interface ClientCCostAlertsProps {
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface CostAlertsFilters {
  provider: string;
  service: string;
  region: string;
  status: string;
  severity: string;
  uploadId: string | null;
}

export interface CostAlertsFilterOptions {
  providers: string[];
  services: string[];
  regions: string[];
  status: string[];
  severity: string[];
}

export interface AlertItem {
  id?: string;
  name?: string;
  title?: string;
  ruleName?: string;
  description?: string;
  summary?: string;
  severity?: string;
  status?: string;
  costImpact?: number;
  impact?: number;
  createdAt?: string;
  timestamp?: string;
  triggeredDate?: string | null;
  resolvedAt?: string | null;
  category?: string;
  provider?: string;
  service?: string;
  region?: string;
  [key: string]: unknown;
}

export interface BudgetItem {
  id?: string;
  name?: string;
  budgetName?: string;
  status?: string;
  spent?: number;
  budget?: number;
  percentage?: number;
  remaining?: number;
  threshold?: number;
  lastUpdated?: string;
  updatedAt?: string;
  currentSpent?: number;
  budgetAmount?: number;
  currentSpend?: number;
  limit?: number;
  percentageUsed?: number;
  [key: string]: unknown;
}

export interface AlertsEndpointData {
  alerts?: AlertItem[];
  summary?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BudgetStatusEndpointData {
  budgets?: BudgetItem[];
  status?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CostAlertsApiData {
  alerts: AlertsEndpointData | AlertItem[] | null;
  budgetStatus: BudgetStatusEndpointData | BudgetItem[] | null;
}

export interface AlertMetric {
  name: string;
  severity: string;
  status: string;
  costImpact: number;
  triggeredDate: string | null;
  ruleName: string;
}

export interface BudgetMetric {
  name: string;
  currentSpent: number;
  budgetAmount: number;
  percentageUsed: number;
  status: string;
}

export interface CostAlertsExtractedData {
  alerts: {
    alerts: AlertItem[];
    summary: Record<string, unknown>;
    alertMetrics: Record<string, AlertMetric>;
  };
  budgetStatus: {
    budgets: BudgetItem[];
    status: Record<string, unknown>;
    budgetMetrics: Record<string, BudgetMetric>;
  };
  metadata: {
    isEmptyState: boolean;
  };
}

export interface DistributionItem {
  name: string;
  count: number;
}

export interface CostAlertsNormalizedData {
  alerts: AlertItem[];
  budgetStatus: BudgetItem[];
  severityDistribution: DistributionItem[];
  statusDistribution: DistributionItem[];
  metadata: {
    isEmptyState: boolean;
  };
}

export interface ClientCCostAlertsViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: CostAlertsFilters;
  filterOptions: CostAlertsFilterOptions;
  onFilterChange: (next: Partial<CostAlertsFilters>) => void;
  onReset: () => void;
  loading: boolean;
  isFiltering: boolean;
  alertsData: CostAlertsApiData | null;
  extractedData: CostAlertsNormalizedData;
  isEmptyState: boolean;
}

export interface UseClientCCostAlertsDataResult {
  alertsData: CostAlertsApiData | null;
  loading: boolean;
  isFiltering: boolean;
  error: string | null;
}

export interface UseClientCCostAlertsFiltersResult {
  filterOptions: CostAlertsFilterOptions;
  loading: boolean;
  error: string | null;
}

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
