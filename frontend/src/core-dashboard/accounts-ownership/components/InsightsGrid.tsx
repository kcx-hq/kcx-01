import React from "react";
import { Briefcase } from "lucide-react";
import { formatCurrency } from "../utils/format";
import type { InsightsGridProps } from "../types";

export function InsightsGrid({ insights }: InsightsGridProps) {
  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
        <Briefcase size={16} className="text-[var(--brand-primary)]" />
        Ownership Insights
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Accounts</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{insights.totalAccounts || 0}</p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">With Assigned Owners</p>
          <p className="text-2xl font-bold text-emerald-700">{insights.accountsWithOwner || 0}</p>
          <p className="mt-1 text-[9px] text-emerald-800/70">(inferred)</p>
        </div>

        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">Without Owners</p>
          <p className="text-2xl font-bold text-rose-700">{insights.accountsWithoutOwner || 0}</p>
          <p className="mt-1 text-[9px] text-rose-800/70">(no tag detected)</p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">Spend Unattributed</p>
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(insights.spendWithoutOwner || 0)}</p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">% Unattributed</p>
          <p className="text-2xl font-bold text-amber-700">
            {Number(insights.spendUnattributedPercent || 0).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

export default InsightsGrid;
