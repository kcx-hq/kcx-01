import React from "react";
import { AlertTriangle } from "lucide-react";
import { Sparkline } from "../components/Sparkline";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency } from "../utils/format";
import type { ResourceItem, ResourceTableProps } from "../types";

const ResourceTableView = ({
  rows,
  isPremiumMasked,
  onRowClick,
  flaggedResources,
}: ResourceTableProps) => {
  const displayRows = isPremiumMasked ? rows.slice(0, 10) : rows;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] text-[var(--text-muted)]">
          <tr>
            <th className="max-w-[300px] px-4 py-3 md:px-6">Resource Identifier</th>
            <th className="px-4 py-3 md:px-6">Type</th>
            <th className="px-4 py-3 md:px-6">Location</th>
            <th className="px-4 py-3 md:px-6">Health Status</th>
            <th className="w-32 px-4 py-3 md:px-6">Trend</th>
            <th className="w-24 px-4 py-3 text-center md:px-6">Flagged</th>
            <th className="px-4 py-3 text-right md:px-6">Total Cost</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[var(--border-muted)]">
          {displayRows.map((item: ResourceItem) => {
            const isFlagged = flaggedResources.has(item.id);
            return (
              <tr
                key={item.id}
                onClick={() => onRowClick(item)}
                className={`group cursor-pointer transition-colors hover:bg-[var(--bg-surface)] ${
                  isFlagged ? "bg-amber-50/60" : ""
                }`}
              >
                <td className="px-4 py-3 font-mono text-[var(--text-secondary)] transition-colors group-hover:text-[var(--brand-primary)] md:px-6">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="max-w-[300px] truncate" title={item.id}>
                      {item.id}
                    </span>
                    {isFlagged && (
                      <AlertTriangle size={12} className="shrink-0 text-amber-600" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)] md:px-6">{item.service || "N/A"}</td>
                <td className="px-4 py-3 text-[var(--text-muted)] md:px-6">{item.region || "N/A"}</td>
                <td className="px-4 py-3 md:px-6">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 md:px-6">
                  <Sparkline
                    data={item.trend}
                    color={item.status === "Spiking" ? "#b45309" : "#007758"}
                  />
                </td>
                <td className="px-4 py-3 text-center md:px-6">
                  {isFlagged ? (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                      <AlertTriangle size={10} /> Flagged
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)]">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-[var(--text-primary)] md:px-6">
                  {formatCurrency(item.totalCost)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResourceTableView;




