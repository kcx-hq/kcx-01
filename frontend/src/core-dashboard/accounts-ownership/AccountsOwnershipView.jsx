import React from "react";
import { Users, Loader2 } from "lucide-react";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";
import { InsightsGrid } from "./components/InsightsGrid";
import { Toolbar } from "./components/Toolbar";
import { AccountsTable } from "./components/AccountsTable";
import { TablePremiumOverlay } from "./components/TablePremiumOverlay";
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
  onExport,
  hasData,
}) {
  if (error && !hasData) return <ErrorState error={error} />;
  if (!hasData && loading) return <LoadingState />;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#0f0f11] text-white font-sans animate-in fade-in duration-500 relative">
      {/* subtle filtering indicator */}
      {isFiltering && hasData && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-[#1a1b20] border border-[#a02ff1]/30 rounded-lg px-3 py-2 shadow-lg">
          <Loader2 size={16} className="text-[#a02ff1] animate-spin" />
          <p className="text-gray-400 text-xs">Updating...</p>
        </div>
      )}

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
          onExport={onExport}
        />

        <div className="overflow-x-auto relative">
          {isPremiumMasked ? (
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
