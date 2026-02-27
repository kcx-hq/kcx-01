import type {
  AccountsApiEnvelope,
  AccountsOwnershipData,
  AccountsOwnershipInsights,
  AccountsQueryParams,
  BuildAccountsParamsInput,
} from "../types";

const DEFAULT_INSIGHTS: AccountsOwnershipInsights = {
  totalAccounts: 0,
  accountsWithOwner: 0,
  accountsWithoutOwner: 0,
  spendWithOwner: 0,
  spendWithoutOwner: 0,
  spendUnattributedPercent: 0,
  totalSpend: 0,
};

const DEFAULT_RESPONSE: AccountsOwnershipData = {
  accounts: [],
  insights: DEFAULT_INSIGHTS,
  providers: [],
};

export const buildAccountsParams = ({ debouncedFilters }: BuildAccountsParamsInput): AccountsQueryParams => {
  return {
    provider: debouncedFilters.provider !== "All" ? debouncedFilters.provider : undefined,
    service: debouncedFilters.service !== "All" ? debouncedFilters.service : undefined,
    region: debouncedFilters.region !== "All" ? debouncedFilters.region : undefined,
    ownershipStatus: debouncedFilters.ownershipStatus !== "All" ? debouncedFilters.ownershipStatus : undefined,
    period: "last90days",
    sortBy: debouncedFilters.sortBy || "cost",
    sortOrder: debouncedFilters.sortOrder || "desc",
  };
};

export const normalizeAccountsResponse = (
  data: unknown,
): AccountsOwnershipData => {
  const envelope = data as AccountsApiEnvelope | AccountsOwnershipData | null | undefined;
  const result = (envelope ?? null) as AccountsOwnershipData | null;

  if (!result) {
    return DEFAULT_RESPONSE;
  }

  return result as AccountsOwnershipData;
};
