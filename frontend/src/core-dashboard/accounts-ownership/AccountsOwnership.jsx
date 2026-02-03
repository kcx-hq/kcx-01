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

  // API filters: only service, region, sort (no provider/ownership — those are client-side only so no refetch/loading)
  const apiFilters = useMemo(
    () => ({
      service: filters.service || "All",
      region: filters.region || "All",
      sortBy,
      sortOrder,
    }),
    [filters.service, filters.region, sortBy, sortOrder]
  );

  const debouncedApiFilters = useDebounce(apiFilters, 300);

  const { accountsData, loading, isFiltering, error } = useAccountsOwnershipData({
    api,
    caps,
    debouncedFilters: debouncedApiFilters,
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

  // client-side filter by ownership status and provider (same logic as table badge)
  const filteredByToolbar = useMemo(() => {
    return allAccounts.filter((acc) => {
      const accProvider = (acc.provider || "").trim().toLowerCase();
      const selProvider = (filterProvider || "").trim().toLowerCase();
      const providerMatch = filterProvider === "All" || !selProvider || accProvider === selProvider;

      const isAssigned =
        (acc.owner && String(acc.owner).trim() !== "") || acc.ownershipStatus === "Assigned (inferred)";
      const ownerMatch =
        filterOwner === "All" ||
        (filterOwner === "Assigned" && isAssigned) ||
        (filterOwner === "Unassigned" && !isAssigned);

      return providerMatch && ownerMatch;
    });
  }, [allAccounts, filterProvider, filterOwner]);

  // client-side search on toolbar-filtered list
  const filteredBySearch = useMemo(() => {
    if (!searchTerm.trim()) return filteredByToolbar;

    const q = searchTerm.toLowerCase().trim();
    const searchNumber = parseFloat(searchTerm.replace(/[$,]/g, ""));
    const isNumeric = !Number.isNaN(searchNumber);

    return filteredByToolbar.filter((acc) => {
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
  }, [filteredByToolbar, searchTerm]);

  // sort for table (name, cost, owner)
  const filteredAccounts = useMemo(() => {
    const list = [...filteredBySearch];
    const mult = sortOrder === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "name") {
        const na = (a.accountName || a.accountId || "").toLowerCase();
        const nb = (b.accountName || b.accountId || "").toLowerCase();
        return mult * na.localeCompare(nb);
      }
      if (sortBy === "cost") {
        const ca = parseFloat(a.cost || 0);
        const cb = parseFloat(b.cost || 0);
        return mult * (ca - cb);
      }
      if (sortBy === "owner") {
        const oa = (a.owner || "").toLowerCase();
        const ob = (b.owner || "").toLowerCase();
        return mult * oa.localeCompare(ob);
      }
      return 0;
    });
    return list;
  }, [filteredBySearch, sortBy, sortOrder]);

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

  const onReset = useCallback(() => {
    setSearchTerm("");
    setFilterOwner("All");
    setFilterProvider("All");
    setSortBy("cost");
    setSortOrder("desc");
  }, []);

  const onExport = useCallback(() => {
    const accountsToExport = filteredAccounts;

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
  }, [filteredAccounts]);

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
      onReset={onReset}
      onExport={onExport}
      hasData={!!accountsData}
    />
  );
}
