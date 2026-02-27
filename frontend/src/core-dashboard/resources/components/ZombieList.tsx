import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../utils/format";
import type { ResourceItem, ZombieListProps } from "../types";

const ZombieListView = ({ data, onInspect }: ZombieListProps) => {
  const zombies = data.filter((i: ResourceItem) => i.status === "Zombie");
  const potentialSavings = zombies.reduce((acc: number, curr: ResourceItem) => acc + (curr.totalCost || 0), 0);

  return (
    <div className="space-y-4 p-3 md:space-y-6 md:p-4">
      <div className="flex flex-col justify-between gap-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 md:flex-row md:items-center md:p-6">
        <div className="flex items-center gap-4 md:gap-5">
          <div className="rounded-full border border-amber-200 bg-white p-3 text-amber-700 md:p-4">
            <Trash2 size={28} />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-black text-[var(--text-primary)] md:text-xl">Cleanup Opportunity</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">{zombies.length}</strong> resources identified as potential
              zombies (zero usage, high cost).
            </p>
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-700">
            Potential Monthly Savings
          </p>
          <p className="font-mono text-3xl font-black text-amber-700 md:text-4xl">
            {formatCurrency(potentialSavings)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border-light)] bg-white">
        <table className="min-w-[760px] w-full text-left text-xs">
          <thead className="bg-[var(--bg-surface)] font-bold uppercase text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-4 md:px-6">Resource Identifier</th>
              <th className="px-4 py-4 md:px-6">Detection Logic</th>
              <th className="px-4 py-4 text-right md:px-6">Cost Impact</th>
              <th className="px-4 py-4 text-right md:px-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-muted)]">
            {zombies.map((item: ResourceItem) => (
              <tr key={item.id} className="group transition-colors hover:bg-[var(--bg-surface)]">
                <td className="px-4 py-4 md:px-6">
                  <div className="max-w-[320px] truncate font-bold text-[var(--text-primary)] transition-colors group-hover:text-amber-700">
                    {item.id}
                  </div>
                  <div className="mt-1 flex gap-2 text-[10px] text-[var(--text-muted)]">
                    <span className="rounded bg-[var(--bg-soft)] px-1.5">{item.service}</span>
                    <span>{item.region}</span>
                  </div>
                </td>
                <td className="px-4 py-4 md:px-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span className="text-[var(--text-secondary)]">0% Utilization / Idle</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-mono font-bold text-[var(--text-primary)] md:px-6">
                  {formatCurrency(item.totalCost)}
                </td>
                <td className="px-4 py-4 text-right md:px-6">
                  <button
                    onClick={() => onInspect(item)}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 font-bold text-[var(--brand-primary)] transition-colors hover:bg-emerald-100"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
            {zombies.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center italic text-[var(--text-muted)]">
                  No zombie resources detected. Infrastructure is clean.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ZombieListView;



