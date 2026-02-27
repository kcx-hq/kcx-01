import type { Dispatch, SetStateAction } from "react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";

export type AccountsOwnershipSortField = "resourceId" | "count" | "cost";
export type AccountsOwnershipSortOrder = "asc" | "desc";

export interface AccountsOwnershipFilters {
  provider?: string;
  service?: string;
  region?: string;
  uploadId?: string;
  requiredTags?: string[];
}

export interface AccountsOwnershipProps {
  filters?: AccountsOwnershipFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface TagCoverageRow {
  resourceId?: string;
  resourceName?: string;
  missingTags?: string[];
  cost?: number | string;
  [key: string]: unknown;
}

export interface TagCoverageData {
  taggedCost: number;
  untaggedCost: number;
  taggedPercent: number;
  untaggedPercent: number;
  missingTags: TagCoverageRow[];
}

export interface AccountsOwnershipApiFilters {
  provider: string;
  service: string;
  region: string;
  sortBy: AccountsOwnershipSortField;
  sortOrder: AccountsOwnershipSortOrder;
  requiredTags?: string[];
}

export interface BuildAccountsParamsInput {
  debouncedFilters: Partial<AccountsOwnershipApiFilters>;
  uploadId?: string | undefined;
}

export interface AccountsOwnershipQueryParams extends Record<string, string | string[] | undefined> {
  uploadId?: string | undefined;
  provider?: string;
  service?: string;
  region?: string;
  requiredTags?: string[];
}

export interface UseAccountsOwnershipDataParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  debouncedFilters: Partial<AccountsOwnershipApiFilters>;
  uploadId?: string | undefined;
}

export interface UseAccountsOwnershipDataResult {
  accountsData: TagCoverageData | null;
  loading: boolean;
  isFiltering: boolean;
  error: string | null;
}

export interface AccountsOwnershipViewProps {
  isPremiumMasked: boolean;
  loading: boolean;
  isFiltering: boolean;
  error: string | null;
  hasData: boolean;
  coverage: TagCoverageData;
  rows: TagCoverageRow[];
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  filterProvider: string;
  onFilterProviderChange: Dispatch<SetStateAction<string>>;
  sortBy: AccountsOwnershipSortField;
  sortOrder: AccountsOwnershipSortOrder;
  onSortChange: (field: AccountsOwnershipSortField) => void;
  onExport: () => void;
}

export interface MissingTagsTableProps {
  rows: TagCoverageRow[];
  sortBy: AccountsOwnershipSortField;
  sortOrder: AccountsOwnershipSortOrder;
  onSortChange: (field: AccountsOwnershipSortField) => void;
}

export type CoverageChipTone = "neutral" | "good" | "warn" | "bad";

export interface CoverageChipProps {
  label: string;
  value: string;
  tone?: CoverageChipTone;
}

export interface TagCoverageEnvelope {
  success?: boolean;
  data?: Partial<TagCoverageData> | null;
}

export interface ApiLikeError {
  code?: string;
  status?: number;
  requestId?: string;
  name?: string;
  message?: string;
  response?: {
    status?: number;
  };
}
