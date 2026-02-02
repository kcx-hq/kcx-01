import React from "react";
import { Users, Loader2 } from "lucide-react";
import { ErrorState } from "./components/ErrorState";
import { InsightsGrid } from "./components/InsightsGrid";
import { Toolbar } from "./components/Toolbar";
import { AccountsTable } from "./components/AccountsTable";
import PremiumGate from "../common/PremiumGate";

export function AccountsOwnershipView({
  // states
  isPremiumMasked,
  loading,
  isFiltering,
  error,

  // data
  insights,
  providers,
  filteredAccounts,

  // ui state
  searchTerm,
  setSearchTerm,
  filterOwner,
  onFilterOwnerChange,
  filterProvider,
  onFilterProviderChange,
  sortBy,
  sortOrder,
  onSortChange,

  // actions
  onReset,
  onExport,
  hasData,
}) {
  if (error && !hasData) return <ErrorState error={error} />;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#0f0f11] text-white font-sans animate-in fade-in duration-500 relative">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-[#a02ff1]" /> Accounts & Ownership
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Cost attribution and governance ledger. Identify account-level cost
            ownership and accountability gaps.
            <span className="text-gray-500 text-xs block mt-1">
              Ownership is inferred from resource tags and is not explicitly
              configured.
            </span>
          </p>
        </div>
      </div>

      <InsightsGrid insights={insights} />

      <div className="bg-[#1a1b20] border border-white/10 rounded-xl flex flex-col shadow-lg">
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

        {/* Table section: loading overlay (same as Overview/Cost-Analysis) below toolbar */}
        <div className="overflow-x-auto relative min-h-[50vh]">
          {(loading || isFiltering) && (
            <div
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f11]/95 backdrop-blur-sm rounded-b-xl border-t border-white/5"
              aria-busy="true"
              aria-live="polite"
            >
              <Loader2 className="animate-spin text-[#a02ff1]" size={40} strokeWidth={2} />
              <p className="mt-3 text-sm font-medium text-gray-400">
                {loading && !hasData ? "Loading accounts…" : "Updating…"}
              </p>
            </div>
          )}

          {!hasData && !loading ? (
            <div className="p-10 text-center text-gray-500">
              <p>No account data available. Upload billing data to view ownership.</p>
            </div>
          ) : (
            isPremiumMasked ? (
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
            )
          )}
        </div>
      </div>
    </div>
  );
}
