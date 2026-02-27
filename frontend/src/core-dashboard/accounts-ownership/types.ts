import type { DashboardFilters } from "../dashboard/types";
import type { ApiClient, Capabilities } from "../../services/apiClient";

export type AccountsSortField = "name" | "cost" | "owner";
export type SortOrder = "asc" | "desc";
export type OwnershipFilter = "All" | "Assigned" | "Unassigned";

export interface AccountOwnershipRow {
  accountId: string;
  displayAccountId?: string;
  accountName: string;
  provider: string;
  topService: string;
  cost: number | string;
  percentage: number | string;
  owner?: string;
  ownershipStatus?: "Assigned (inferred)" | "No owner tag detected" | string;
}

export interface AccountsOwnershipInsights {
  totalAccounts: number;
  accountsWithOwner: number;
  accountsWithoutOwner: number;
  spendWithOwner: number;
  spendWithoutOwner: number;
  spendUnattributedPercent: number;
  totalSpend: number;
}

export interface AccountsOwnershipData {
  accounts: AccountOwnershipRow[];
  insights: AccountsOwnershipInsights;
  providers: string[];
}

export type AccountsOwnershipFilters = Partial<DashboardFilters> & {
  ownershipStatus?: string;
};

export interface AccountsOwnershipContainerProps {
  filters?: AccountsOwnershipFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface AccountsApiFilters {
  service: string;
  region: string;
  sortBy: AccountsSortField;
  sortOrder: SortOrder;
  provider?: string;
  ownershipStatus?: string;
}

export interface UseAccountsOwnershipDataParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  debouncedFilters: AccountsApiFilters;
}

export interface UseAccountsOwnershipDataResult {
  accountsData: AccountsOwnershipData | null;
  loading: boolean;
  isFiltering: boolean;
  error: string | null;
}

export interface AccountsOwnershipViewProps {
  isPremiumMasked: boolean;
  loading: boolean;
  error: string | null;
  insights: AccountsOwnershipInsights;
  providers: string[];
  filteredAccounts: AccountOwnershipRow[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterOwner: OwnershipFilter;
  onFilterOwnerChange: (value: OwnershipFilter) => void;
  filterProvider: string;
  onFilterProviderChange: (value: string) => void;
  sortBy: AccountsSortField;
  sortOrder: SortOrder;
  onSortChange: (field: AccountsSortField) => void;
  onReset: () => void;
  onExport: () => void;
  hasData: boolean;
}

export interface AccountsTableProps {
  accounts: AccountOwnershipRow[];
  sortBy: AccountsSortField;
  sortOrder: SortOrder;
  onSortChange: (field: AccountsSortField) => void;
}

export interface ToolbarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterOwner: OwnershipFilter;
  onFilterOwnerChange: (value: OwnershipFilter) => void;
  filterProvider: string;
  onFilterProviderChange: (value: string) => void;
  providers: string[];
  onReset?: () => void;
  onExport: () => void;
}

export interface InsightsGridProps {
  insights: AccountsOwnershipInsights;
}

export interface ErrorStateProps {
  error: string | null;
}

export interface LoadingStateProps {
  label?: string;
}

export interface BuildAccountsParamsInput {
  debouncedFilters: AccountsApiFilters;
}

export interface AccountsQueryParams extends Record<string, string | undefined> {
  provider: string | undefined;
  service: string | undefined;
  region: string | undefined;
  ownershipStatus: string | undefined;
  period: "last90days";
  sortBy: AccountsSortField;
  sortOrder: SortOrder;
}

export interface AccountsApiEnvelope {
  success?: boolean;
  data?: AccountsOwnershipData | null;
}

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
  response?: {
    status?: number;
  };
}
