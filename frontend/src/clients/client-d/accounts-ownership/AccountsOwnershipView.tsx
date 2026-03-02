import React from "react";
import type { ChangeEvent } from "react";
import { Tags, ShieldAlert, Loader2, Download } from "lucide-react";
import PremiumGate from "../../../core-dashboard/common/PremiumGate";
import { LoadingState } from "../../../core-dashboard/accounts-ownership/components/LoadingState";
import { ErrorState } from "../../../core-dashboard/accounts-ownership/components/ErrorState";
import { formatCurrency } from "../../../core-dashboard/accounts-ownership/utils/format";
import type {
  AccountsOwnershipSortField,
  AccountsOwnershipViewProps,
  CoverageChipProps,
  CoverageChipTone,
  MissingTagsTableProps,
  TagCoverageRow,
} from "./types";

function Chip({ label, value, tone = "neutral" }: CoverageChipProps) {
  const tones: Record<CoverageChipTone, string> = {
    neutral: "bg-white/5 border-white/10 text-gray-200",
    good: "bg-emerald-500/10 border-emerald-500/20 text-emerald-200",
    warn: "bg-yellow-500/10 border-yellow-500/20 text-yellow-200",
    bad: "bg-red-500/10 border-red-500/20 text-red-200",
  };

  return (
    <div className={`px-3 py-2 rounded-2xl border ${tones[tone] || tones.neutral}`}>
      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
        {label}
      </div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function MissingTagsTable({ rows, sortBy, sortOrder, onSortChange }: MissingTagsTableProps) {
  const sortIcon = (key: AccountsOwnershipSortField) =>
    sortBy === key ? (sortOrder === "asc" ? " ↑" : " ↓") : "";

  return (
    <table className="min-w-full text-xs">
      <thead className="sticky top-0 bg-[#25262b] text-gray-400 font-bold z-10">
        <tr>
          <th className="px-4 py-3 text-left cursor-pointer" onClick={() => onSortChange("resourceId")}>
            Resource{sortIcon("resourceId")}
          </th>
          <th className="px-4 py-3 text-left">Name</th>
          <th className="px-4 py-3 text-left cursor-pointer" onClick={() => onSortChange("count")}>
            Missing Tags{sortIcon("count")}
          </th>
          <th className="px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("cost")}>
            Cost{sortIcon("cost")}
          </th>
        </tr>
      </thead>

      <tbody>
        {rows.map((r: TagCoverageRow) => (
          <tr key={r.resourceId} className="border-b border-white/5 hover:bg-white/5">
            <td className="px-4 py-3 font-mono text-gray-200">{r.resourceId}</td>
            <td className="px-4 py-3 text-gray-300">{r.resourceName ?? "—"}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {(r.missingTags || []).map((t: string) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-[10px] font-bold"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </td>
            <td className="px-4 py-3 text-right font-mono text-[#23a282]">
              {formatCurrency(r.cost || 0)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AccountsOwnershipView({
  // states
  isPremiumMasked,
  loading,
  isFiltering,
  error,
  hasData,

  // data (new)
  coverage, // { taggedCost, untaggedCost, taggedPercent, untaggedPercent, missingTags }
  rows,

  // ui
  searchTerm,
  setSearchTerm,
  filterProvider,
  onFilterProviderChange,
  sortBy,
  sortOrder,
  onSortChange,

  // actions
  onExport,
}: AccountsOwnershipViewProps) {
  if (error && !hasData) return <ErrorState error={error} />;
  if (!hasData && loading) return <LoadingState />;

  const taggedTone: CoverageChipTone = (coverage?.taggedPercent ?? 0) >= 80 ? "good" : "warn";
  const untaggedTone: CoverageChipTone = (coverage?.untaggedPercent ?? 0) >= 50 ? "bad" : "warn";

  const totalCost = Number(coverage?.taggedCost || 0) + Number(coverage?.untaggedCost || 0);

  return (
    <div className="p-6 space-y-5 min-h-screen bg-[#0f0f11] text-white font-sans animate-in fade-in duration-500 relative">
      {/* subtle filtering indicator */}
      {isFiltering && hasData && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-[#1a1b20] border border-[#23a282]/30 rounded-lg px-3 py-2 shadow-lg">
          <Loader2 size={16} className="text-[#23a282] animate-spin" />
          <p className="text-gray-400 text-xs">Updating...</p>
        </div>
      )}

      {/* HERO */}
      <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-[#171820] to-[#0f0f11] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Tags className="text-[#23a282]" size={22} />
              Tag Coverage
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Track tagged vs untagged spend and fix missing tag policies.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Chip
                label="Total Spend"
                value={formatCurrency(totalCost)}
                tone="neutral"
              />
              <Chip
                label="Tagged"
                value={`${coverage?.taggedPercent ?? 0}% • ${formatCurrency(coverage?.taggedCost ?? 0)}`}
                tone={taggedTone}
              />
              <Chip
                label="Untagged"
                value={`${coverage?.untaggedPercent ?? 0}% • ${formatCurrency(coverage?.untaggedCost ?? 0)}`}
                tone={untaggedTone}
              />
              <Chip
                label="Violations"
                value={String(rows?.length || 0)}
                tone={rows?.length ? "bad" : "good"}
              />
            </div>
          </div>

          <button
            onClick={onExport}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#23a282]/10 hover:bg-[#23a282]/20 border border-[#23a282]/30 text-[#23a282] text-xs font-extrabold transition"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* tiny warning strip */}
        {(coverage?.untaggedPercent ?? 0) >= 50 && (
          <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-300" />
            <span className="text-red-200 text-xs font-semibold">
              High untagged spend detected — enforce required tags (Owner, Project, CostCenter).
            </span>
          </div>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            placeholder="Search resource id, name, tag, cost..."
            className="w-full md:w-[420px] px-4 py-2 rounded-xl bg-[#1a1b20] border border-white/10 text-xs text-white focus:outline-none focus:border-[#23a282]"
          />
          <select
            value={filterProvider}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onFilterProviderChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1a1b20] border border-white/10 text-xs text-gray-200 outline-none"
            style={{ colorScheme: "dark" }}
          >
            <option value="All">All providers</option>
            <option value="aws">aws</option>
            <option value="azure">azure</option>
            <option value="gcp">gcp</option>
          </select>
        </div>

        <div className="text-xs text-gray-500">
          Showing <span className="text-gray-200 font-semibold">{rows?.length || 0}</span> resources with missing tags
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#1a1b20] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="max-h-[560px] overflow-auto relative">
          {isPremiumMasked ? (
            <PremiumGate variant="wrap">
              <MissingTagsTable
                rows={rows || []}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
              />
            </PremiumGate>
          ) : (
            <MissingTagsTable
              rows={rows || []}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
          )}
        </div>

        {!rows?.length && (
          <div className="p-10 text-center text-gray-400 text-sm">
            No missing-tag violations found.
          </div>
        )}
      </div>
    </div>
  );
}
