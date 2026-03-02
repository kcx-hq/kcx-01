import React from "react";
import { Users } from "lucide-react";
import ErrorState from "./components/ErrorState";
import InsightsGrid from "./components/InsightsGrid";
import Toolbar from "./components/Toolbar";
import AccountsTable from "./components/AccountsTable";
import PremiumGate from "../common/PremiumGate";
import { SectionLoading, SectionRefreshOverlay } from "../common/SectionStates";
import type { AccountsOwnershipViewProps } from "./types";

export function AccountsOwnershipView({
  isPremiumMasked,
  loading,
  isFiltering,
  error,
  insights,
  providers,
  filteredAccounts,
  searchTerm,
  setSearchTerm,
  filterOwner,
  onFilterOwnerChange,
  filterProvider,
  onFilterProviderChange,
  sortBy,
  sortOrder,
  onSortChange,
  onReset,
  onExport,
  hasData,
}: AccountsOwnershipViewProps) {
  if (error && !hasData) return <ErrorState error={error} />;
  if (loading && !hasData) {
    return <SectionLoading label="Analyzing Accounts & Ownership..." />;
  }

  return (
    <div className="core-shell animate-in fade-in duration-500">
      <div className="core-panel flex flex-col gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black tracking-tight md:text-2xl">
            <Users className="text-[var(--brand-primary)]" /> Accounts & Ownership
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Cost attribution and governance ledger. Identify account-level cost ownership and accountability gaps.
            <span className="mt-1 block text-xs text-[var(--text-muted)]">
              Ownership is inferred from resource tags and is not explicitly configured.
            </span>
          </p>
        </div>
      </div>

      <InsightsGrid insights={insights} />

      <div className="core-card relative flex flex-col overflow-hidden">
        {isFiltering ? (
          <SectionRefreshOverlay rounded="rounded-2xl" label="Refreshing accounts & ownership..." />
        ) : null}
        <Toolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterOwner={filterOwner}
          onFilterOwnerChange={onFilterOwnerChange}
          filterProvider={filterProvider}
          onFilterProviderChange={onFilterProviderChange}
          providers={providers}
          onReset={onReset}
          onExport={onExport}
        />

        <div className="relative min-h-[50vh] overflow-x-auto">
          {!hasData && !loading ? (
            <div className="p-10 text-center text-[var(--text-muted)]">
              <p>No account data available. Upload billing data to view ownership.</p>
            </div>
          ) : isPremiumMasked ? (
            <PremiumGate variant="wrap">
              <AccountsTable
                accounts={filteredAccounts}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
              />
            </PremiumGate>
          ) : (
            <AccountsTable
              accounts={filteredAccounts}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
