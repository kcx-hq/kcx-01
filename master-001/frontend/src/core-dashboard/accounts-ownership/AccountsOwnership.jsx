import React, { useCallback, useMemo, useState } from "react";
import { useAuthStore } from "../../store/Authstore";
import { useDebounce } from "../../hooks/useDebounce";
import { AccountsOwnershipView } from "./AccountsOwnershipView";
import { useAccountsOwnershipData } from "./hooks/useAccountsOwnershipData";
import { formatCurrency } from "./utils/format";

export default function AccountsOwnershipContainer({ filters = {}, api, caps }) {
  const { user } = useAuthStore();
  const isPremiumMasked = !user?.is_premium;

  // module guard
  if (!api || !caps || !caps.modules?.governance?.enabled) return null;

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOwner, setFilterOwner] = useState("All");
  const [filterProvider, setFilterProvider] = useState("All");
  const [sortBy, setSortBy] = useState("cost");
  const [sortOrder, setSortOrder] = useState("desc");

  // ✅ FIXED: provider precedence bug (was: filters.provider || filterProvider !== 'All' ? ...)
  const currentFilters = useMemo(() => {
    const provider = filters.provider && filters.provider !== "All" ? filters.provider : filterProvider;

    return {
      provider: provider || "All",
      service: filters.service || "All",
      region: filters.region || "All",
      ownershipStatus: filterOwner,
      sortBy,
      sortOrder,
    };
  }, [filters.provider, filters.service, filters.region, filterProvider, filterOwner, sortBy, sortOrder]);

  const debouncedFilters = useDebounce(currentFilters, 300);

  const { accountsData, loading, isFiltering, error } = useAccountsOwnershipData({
    api,
    caps,
    debouncedFilters,
    uploadId: filters.uploadId,
  });

  const extracted = useMemo(() => {
    const fallback = {
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
    return accountsData || fallback;
  }, [accountsData]);

  const allAccounts = extracted.accounts || [];

  // client-side search
  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) return allAccounts;

    const q = searchTerm.toLowerCase().trim();
    const searchNumber = parseFloat(searchTerm.replace(/[$,]/g, ""));
    const isNumeric = !Number.isNaN(searchNumber);

    return allAccounts.filter((acc) => {
      const accountName = (acc.accountName || "").toLowerCase();
      const accountId = (acc.accountId || "").toLowerCase();
      const displayId = (acc.displayAccountId || acc.accountId || "").toLowerCase();
      const owner = (acc.owner || "").toLowerCase();
      const provider = (acc.provider || "").toLowerCase();
      const topService = (acc.topService || "").toLowerCase();
      const cost = parseFloat(acc.cost || 0);
      const costString = formatCurrency(acc.cost).toLowerCase();
      const pctString = String(acc.percentage || 0);

      const textMatch =
        accountName.includes(q) ||
        accountId.includes(q) ||
        displayId.includes(q) ||
        owner.includes(q) ||
        provider.includes(q) ||
        topService.includes(q) ||
        costString.includes(q) ||
        pctString.includes(q);

      const numericMatch =
        isNumeric && (Math.abs(cost - searchNumber) < 0.01 || pctString.includes(String(searchNumber)));

      return textMatch || numericMatch;
    });
  }, [allAccounts, searchTerm]);

  const onSortChange = useCallback(
    (field) => {
      if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      else {
        setSortBy(field);
        setSortOrder(field === "cost" ? "desc" : "asc");
      }
    },
    [sortBy, sortOrder]
  );

  const onExport = useCallback(() => {
    const accountsToExport = searchTerm ? filteredAccounts : allAccounts;

    if (!accountsToExport || accountsToExport.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Account ID",
      "Account Name",
      "Provider",
      "Top Service",
      "Monthly Cost",
      "% of Total Spend",
      "Inferred Owner (from tags)",
      "Ownership Status",
    ];

    const rows = accountsToExport.map((acc) => [
      acc.accountId,
      acc.accountName,
      acc.provider,
      acc.topService,
      Number(acc.cost || 0).toFixed(2),
      Number(acc.percentage || 0).toFixed(2) + "%",
      acc.owner || "No owner tag detected",
      acc.ownershipStatus,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `accounts-ownership-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [allAccounts, filteredAccounts, searchTerm]);

  return (
    <AccountsOwnershipView
      isPremiumMasked={isPremiumMasked}
      loading={loading}
      isFiltering={isFiltering}
      error={error}
      insights={extracted.insights || {}}
      providers={extracted.providers || []}
      filteredAccounts={filteredAccounts}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      filterOwner={filterOwner}
      onFilterOwnerChange={setFilterOwner}
      filterProvider={filterProvider}
      onFilterProviderChange={setFilterProvider}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={onSortChange}
      onExport={onExport}
      hasData={!!accountsData}
    />
  );
}
