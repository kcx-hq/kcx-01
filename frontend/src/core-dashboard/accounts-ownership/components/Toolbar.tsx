import React from "react";
import { Search, Download, RefreshCw } from "lucide-react";
import type { ChangeEvent } from "react";
import type { OwnershipFilter, ToolbarProps } from "../types";

export function Toolbar({
  searchTerm,
  setSearchTerm,
  filterOwner,
  onFilterOwnerChange,
  filterProvider,
  onFilterProviderChange,
  providers,
  onReset,
  onExport,
}: ToolbarProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-b border-[var(--border-light)] bg-[var(--bg-surface)] p-3 md:flex-row md:gap-4 md:p-4">
      <div className="relative w-full flex-1 lg:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
        <input
          type="text"
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-[var(--border-light)] bg-white py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200"
        />
      </div>

      <div className="flex w-full gap-2 overflow-x-auto lg:w-auto">
        <select
          value={filterOwner}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onFilterOwnerChange(e.target.value as OwnershipFilter)}
          className="min-w-[150px] cursor-pointer rounded-lg border border-[var(--border-light)] bg-white py-2 pl-3 pr-8 text-xs font-bold text-[var(--text-secondary)] outline-none transition-colors hover:bg-[var(--bg-surface)]"
        >
          <option value="All">All Ownership Status</option>
          <option value="Assigned">Assigned (inferred)</option>
          <option value="Unassigned">No owner tag detected</option>
        </select>

        <select
          value={filterProvider}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onFilterProviderChange(e.target.value)}
          className="min-w-[120px] cursor-pointer rounded-lg border border-[var(--border-light)] bg-white py-2 pl-3 pr-8 text-xs font-bold text-[var(--text-secondary)] outline-none transition-colors hover:bg-[var(--bg-surface)]"
        >
          <option value="All">All Providers</option>
          {(providers || []).map((p: string) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-[var(--border-light)] bg-white p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]"
            title="Reset filters and search"
          >
            <RefreshCw size={16} />
          </button>
        )}

        <button
          onClick={onExport}
          className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-[var(--brand-primary)] transition-all hover:bg-emerald-100"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
