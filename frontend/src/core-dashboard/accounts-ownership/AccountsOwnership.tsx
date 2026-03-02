import React, { useCallback, useMemo, useState } from "react";
import { useAuthStore } from "../../store/Authstore";
import { useDebounce } from "../../hooks/useDebounce";
import { AccountsOwnershipView } from "./AccountsOwnershipView";
import { useAccountsOwnershipData } from "./hooks/useAccountsOwnershipData";
import { formatCurrency } from "./utils/format";
import type {
  AccountOwnershipRow,
  AccountsOwnershipContainerProps,
  AccountsOwnershipData,
  AccountsSortField,
  OwnershipFilter,
  SortOrder,
} from "./types";

export default function AccountsOwnershipContainer({ filters = {}, api, caps }: AccountsOwnershipContainerProps) {
  // module guard
  if (!api || !caps || !caps.modules?.["governance"]?.enabled) return null;

  return <AccountsOwnershipContainerContent filters={filters} api={api} caps={caps} />;
}

function AccountsOwnershipContainerContent({ filters = {}, api, caps }: AccountsOwnershipContainerProps) {
  const { user } = useAuthStore();
  const isPremiumMasked = !user?.is_premium;

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOwner, setFilterOwner] = useState<OwnershipFilter>("All");
  const [filterProvider, setFilterProvider] = useState("All");
  const [sortBy, setSortBy] = useState<AccountsSortField>("cost");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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
  });

  const extracted = useMemo(() => {
    const fallback: AccountsOwnershipData = {
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

  // client-side filter by ownership status and provider (same logic as table badge)
  const filteredByToolbar = useMemo(() => {
    return extracted.accounts.filter((acc: AccountOwnershipRow) => {
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
  }, [extracted.accounts, filterProvider, filterOwner]);

  // client-side search on toolbar-filtered list
  const filteredBySearch = useMemo(() => {
    if (!searchTerm.trim()) return filteredByToolbar;

    const q = searchTerm.toLowerCase().trim();
    const searchNumber = parseFloat(searchTerm.replace(/[$,]/g, ""));
    const isNumeric = !Number.isNaN(searchNumber);

    return filteredByToolbar.filter((acc: AccountOwnershipRow) => {
      const accountName = (acc.accountName || "").toLowerCase();
      const accountId = (acc.accountId || "").toLowerCase();
      const displayId = (acc.displayAccountId || acc.accountId || "").toLowerCase();
      const owner = (acc.owner || "").toLowerCase();
      const provider = (acc.provider || "").toLowerCase();
      const topService = (acc.topService || "").toLowerCase();
      const cost = parseFloat(String(acc.cost ?? 0));
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
    list.sort((a: AccountOwnershipRow, b: AccountOwnershipRow) => {
      if (sortBy === "name") {
        const na = (a.accountName || a.accountId || "").toLowerCase();
        const nb = (b.accountName || b.accountId || "").toLowerCase();
        return mult * na.localeCompare(nb);
      }
      if (sortBy === "cost") {
        const ca = parseFloat(String(a.cost ?? 0));
        const cb = parseFloat(String(b.cost ?? 0));
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
    (field: AccountsSortField) => {
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

    const rows = accountsToExport.map((acc: AccountOwnershipRow) => [
      String(acc.accountId),
      String(acc.accountName),
      String(acc.provider),
      String(acc.topService),
      Number(acc.cost || 0).toFixed(2),
      Number(acc.percentage || 0).toFixed(2) + "%",
      String(acc.owner || "No owner tag detected"),
      String(acc.ownershipStatus || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: string[]) => r.map((c: string) => `"${c}"`).join(","))].join("\n");

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
      insights={extracted.insights}
      providers={extracted.providers}
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
