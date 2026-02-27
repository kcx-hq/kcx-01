import React, { useCallback, useMemo, useState } from "react";
import { useAuthStore } from "../../../store/Authstore";
import { useDebounce } from "../../../hooks/useDebounce";
import { AccountsOwnershipView } from "./AccountsOwnershipView";
import { formatCurrency } from "../../../core-dashboard/accounts-ownership/utils/format";
import type {
  AccountsOwnershipProps,
  AccountsOwnershipSortField,
  AccountsOwnershipSortOrder,
  TagCoverageRow,
} from "./types";

// ✅ reuse core hook, but response is normalized differently on client-d
import { useAccountsOwnershipData } from "./hooks/useAccountsOwnershipData";
import { normalizeTagCoverageResponse } from "./utils/normalizeTagCoverageResponse";

export default function AccountsOwnership({ filters = {}, api, caps }: AccountsOwnershipProps) {
  // module guard
  if (!api || !caps || !caps.modules?.["governance"]?.enabled) return null;

  return <AccountsOwnershipContent filters={filters} api={api} caps={caps} />;
}

function AccountsOwnershipContent({ filters = {}, api, caps }: AccountsOwnershipProps) {
  const { user } = useAuthStore();
  const isPremiumMasked = !user?.is_premium;

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProvider, setFilterProvider] = useState("All"); // optional if you want UI control
  const [sortBy, setSortBy] = useState<AccountsOwnershipSortField>("cost"); // only for table
  const [sortOrder, setSortOrder] = useState<AccountsOwnershipSortOrder>("desc");

  // provider precedence (filters first, then local)
  const currentFilters = useMemo(() => {
    const provider =
      filters.provider && filters.provider !== "All"
        ? filters.provider
        : filterProvider;

    return {
      provider: provider || "All",
      service: filters.service || "All",
      region: filters.region || "All",
      sortBy,
      sortOrder,
    };
  }, [filters.provider, filters.service, filters.region, filterProvider, sortBy, sortOrder]);

  const debouncedFilters = useDebounce(currentFilters, 300);

  /**
   * NOTE:
   * - We keep using the core hook so you don’t duplicate fetch logic.
   * - Your backend endpoint should return the new shape (tag coverage).
   */
  const { accountsData: rawData, loading, isFiltering, error } = useAccountsOwnershipData({
    api,
    caps,
    debouncedFilters,
    ...(filters.uploadId ? { uploadId: filters.uploadId } : {}),
  });

  // normalize to new response structure
  const data = useMemo(() => normalizeTagCoverageResponse(rawData), [rawData]);

  // build table rows (missingTags list)
  const rows = useMemo(() => {
    const list = data.missingTags || [];

    // search (resourceId/resourceName/tag names/cost)
    const q = searchTerm.trim().toLowerCase();
    let out = !q
      ? list
      : list.filter((r: TagCoverageRow) => {
          const id = String(r.resourceId || "").toLowerCase();
          const name = String(r.resourceName || "").toLowerCase();
          const tags = (r.missingTags || []).join(",").toLowerCase();
          const cost = formatCurrency(r.cost || 0).toLowerCase();
          return id.includes(q) || name.includes(q) || tags.includes(q) || cost.includes(q);
        });

    // sort
    out = [...out].sort((a: TagCoverageRow, b: TagCoverageRow) => {
      const dir = sortOrder === "asc" ? 1 : -1;

      if (sortBy === "cost") return (Number(a.cost || 0) - Number(b.cost || 0)) * dir;

      if (sortBy === "count")
        return ((a.missingTags?.length || 0) - (b.missingTags?.length || 0)) * dir;

      // default: resourceId
      return String(a.resourceId || "").localeCompare(String(b.resourceId || "")) * dir;
    });

    return out;
  }, [data.missingTags, searchTerm, sortBy, sortOrder]);

  const onSortChange = useCallback(
    (field: AccountsOwnershipSortField) => {
      if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      else {
        setSortBy(field);
        setSortOrder(field === "resourceId" ? "asc" : "desc");
      }
    },
    [sortBy, sortOrder]
  );

  const onExport = useCallback(() => {
    const rowsToExport = rows || [];
    if (!rowsToExport.length) {
      alert("No data to export");
      return;
    }

    const headers = ["Resource ID", "Resource Name", "Missing Tags", "Cost"];
    const csvRows = rowsToExport.map((r: TagCoverageRow) => [
      r.resourceId || "",
      r.resourceName || "",
      (r.missingTags || []).join(" | "),
      Number(r.cost || 0).toFixed(2),
    ]);

    const csvContent = [headers.join(","), ...csvRows.map((r: string[]) => r.map((c: string) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tag-coverage-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [rows]);

  return (
    <AccountsOwnershipView
      // states
      isPremiumMasked={isPremiumMasked}
      loading={loading}
      isFiltering={isFiltering}
      error={error}
      hasData={!!rawData}

      // data (new)
      coverage={data}
      rows={rows}

      // ui state
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      filterProvider={filterProvider}
      onFilterProviderChange={setFilterProvider}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={onSortChange}

      // actions
      onExport={onExport}
    />
  );
}
