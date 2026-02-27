import React, { useMemo, useState, useCallback } from "react";
import { useDebounce } from "../../../hooks/useDebounce";

import AccountsOwnershipView from "./AccountsOwnershipView";
import { 
  normalizeAccountsData, 
  normalizeComplianceData, 
  normalizeSummaryData,
  mergeAccountData
} from "./utils/normalizeAccountsData";
import { useAccountsData } from "./hooks/useAccountsData";
import { useComplianceData } from "./hooks/useComplianceData";
import { useSummaryData } from "./hooks/useSummaryData";
import type { AccountsFilters, AccountsOwnershipProps } from "./types";

const AccountsOwnership = ({ api, caps }: AccountsOwnershipProps) => {
  // Local filters
  const [filters, setFilters] = useState<AccountsFilters>({
    provider: "All",
    service: "All",
    region: "All",
  });

  // Used to force refresh after reset (even if debounce doesn't change)
  const [forceRefreshKey, setForceRefreshKey] = useState(0);

  // Debounce the filters (same behavior as your original)
  const debouncedFilters = useDebounce(filters, 300);

  // Fetch accounts data (handles loading + filtering states + abort)
  const { accountsData, loading: accountsLoading, isFiltering: accountsFiltering } = useAccountsData(
    api,
    caps,
    debouncedFilters,
    forceRefreshKey
  );

  // Fetch compliance data (handles loading + filtering states + abort)
  const { complianceData, loading: complianceLoading, isFiltering: complianceFiltering } = useComplianceData(
    api,
    caps,
    debouncedFilters,
    forceRefreshKey
  );

  // Fetch summary data (handles loading + filtering states + abort)
  const { summaryData, loading: summaryLoading, isFiltering: summaryFiltering } = useSummaryData(
    api,
    caps,
    debouncedFilters,
    forceRefreshKey
  );

  // Normalize backend payload for widgets
  const normalizedAccounts = useMemo(
    () => normalizeAccountsData(accountsData),
    [accountsData]
  );

  const normalizedCompliance = useMemo(
    () => normalizeComplianceData(complianceData),
    [complianceData]
  );
  console.log(normalizedCompliance)
  const normalizedSummary = useMemo(
    () => normalizeSummaryData(summaryData),
    [summaryData]
  );

  // Merge data for department breakdown
  const departmentData = useMemo(
    () => mergeAccountData(normalizedAccounts, summaryData, normalizedCompliance),
    [normalizedAccounts, summaryData, normalizedCompliance]
  );

  // Handlers
  const handleFilterChange = useCallback(
    (newFilters: Partial<AccountsFilters>) => {
      setFilters((prev: AccountsFilters) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const handleReset = useCallback(() => {
    const reset: AccountsFilters = { provider: "All", service: "All", region: "All" };
    setFilters(reset);
    setForceRefreshKey((k: number) => k + 1);
  }, []);

  const loading = accountsLoading || complianceLoading || summaryLoading;
  const isFiltering = accountsFiltering || complianceFiltering || summaryFiltering;

  return (
    <AccountsOwnershipView
      api={api}
      caps={caps}
      filters={filters}
      onFilterChange={handleFilterChange}
      onReset={handleReset}
      loading={loading}
      isFiltering={isFiltering}
      accountsData={normalizedAccounts}
      complianceData={normalizedCompliance}
      summaryData={normalizedSummary}
      departmentData={departmentData}
    />
  );
};

export default AccountsOwnership;
