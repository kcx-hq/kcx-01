import type { ApiClient, Capabilities } from "../../../services/apiClient";

export interface AccountsFilters {
  provider: string;
  service: string;
  region: string;
}

export interface AccountItem {
  accountId?: string;
  accountName?: string;
  owner?: string;
  provider?: string;
  department?: string;
  totalSpend?: number | string;
  [key: string]: unknown;
}

export interface AccountsInsights {
  totalAccounts?: number;
  accountsWithOwner?: number;
  accountsWithoutOwner?: number;
  spendWithOwner?: number;
  spendWithoutOwner?: number;
  totalSpend?: number;
  [key: string]: unknown;
}

export interface AccountsRawData {
  accounts?: AccountItem[];
  insights?: AccountsInsights;
  [key: string]: unknown;
}

export interface NormalizedAccountsData {
  accounts: AccountItem[];
  totalAccounts: number;
  ownedAccounts: number;
  unownedAccounts: number;
  ownershipRate: number;
  spendWithOwner: number;
  spendWithoutOwner: number;
  totalSpend: number;
}

export interface ComplianceDepartmentItem {
  department?: string;
  totalCost?: number;
  taggedCost?: number;
  untaggedCost?: number;
  compliancePercent?: number;
  [key: string]: unknown;
}

export interface ComplianceRawData {
  taggedCost?: number;
  untaggedCost?: number;
  taggedPercent?: number;
  untaggedPercent?: number;
  taggedCount?: number;
  untaggedCount?: number;
  countCompliancePercent?: number;
  costCompliancePercent?: number;
  byDepartment?: ComplianceDepartmentItem[];
  [key: string]: unknown;
}

export interface NormalizedComplianceData {
  overall: {
    taggedCost: number;
    untaggedCost: number;
    taggedPercent: number;
    untaggedPercent?: number;
  };
  byDepartment: ComplianceDepartmentItem[];
  compliant: number;
  nonCompliant: number;
  complianceRate: number;
  taggedCount: number;
  untaggedCount: number;
  countCompliancePercent: number;
  costCompliancePercent: number;
}

export interface SummaryRawData {
  totalAccounts?: number;
  totalDepartments?: number;
  overallScoreValue?: number;
  tagCompliance?: {
    taggedCost?: number;
    untaggedCost?: number;
    taggedPercent?: number;
  };
  ownershipGaps?: {
    ownedCount?: number;
    unownedCount?: number;
    ownershipPercentValue?: number;
  };
  [key: string]: unknown;
}

export interface NormalizedSummaryData {
  totalAccounts: number;
  totalDepartments: number;
  ownershipRate: number;
  complianceRate: number;
  overallScore: number;
  tagCompliance: {
    taggedCost: number;
    untaggedCost: number;
    taggedPercent: number;
  };
  ownershipGaps: {
    ownedCount: number;
    unownedCount: number;
    ownershipPercentValue: number;
  };
}

export interface DepartmentMergedItem {
  name: string;
  totalCost: string;
  ownedCost: string;
  unownedCost: string;
  compliantCost: string;
  nonCompliantCost: string;
  ownershipRate: number;
  complianceRate: number;
  count: number;
  taggedCount: number;
  untaggedCount: number;
}

export interface AccountsOwnershipProps {
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface AccountsOwnershipViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: AccountsFilters;
  onFilterChange: (newFilters: Partial<AccountsFilters>) => void;
  onReset: () => void;
  loading: boolean;
  isFiltering: boolean;
  accountsData: NormalizedAccountsData;
  complianceData: NormalizedComplianceData;
  summaryData: NormalizedSummaryData;
  departmentData: DepartmentMergedItem[];
}

export interface HookDataResult<T> {
  loading: boolean;
  isFiltering: boolean;
}

export interface UseAccountsDataResult extends HookDataResult<AccountsRawData> {
  accountsData: AccountsRawData | null;
}

export interface UseSummaryDataResult extends HookDataResult<SummaryRawData> {
  summaryData: SummaryRawData | null;
}

export interface UseComplianceDataResult extends HookDataResult<ComplianceRawData> {
  complianceData: ComplianceRawData | null;
}

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
