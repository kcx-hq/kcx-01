export const buildAccountsParams = ({ debouncedFilters }) => {
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

export const normalizeAccountsResponse = (data) => {
  const result = data?.success && data?.data ? data.data : (data?.data ?? data ?? null);

  if (!result) {
    return {
      accounts: [],
      insights: {
        totalAccounts: 0,
        accountsWithOwner: 0,
        accountsWithoutOwner: 0,
        spendWithOwner: 0,
        spendWithoutOwner: 0,
        spendUnattributedPercent: 0,
        totalSpend: 0,
      },
      providers: [],
    };
  }

  return result;
};
