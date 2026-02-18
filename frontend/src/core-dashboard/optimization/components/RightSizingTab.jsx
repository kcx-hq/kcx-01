import React from "react";
import { TrendingDown, Info } from "lucide-react";
import { formatCurrency } from "../utils/format";

export function RightSizingTab({ rightSizingRecs = [], onSelectInsight }) {
  if (!rightSizingRecs || rightSizingRecs.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-light)] bg-white p-8 text-center">
        <TrendingDown size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
        <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">No Right-Sizing Recommendations</h3>
        <p className="text-sm text-[var(--text-muted)]">
          Right-sizing recommendations require consistent usage patterns over time.
          Upload more billing data or check back after more usage history is available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rightSizingRecs.map((rec) => (
        <div
          key={rec.id}
          className="cursor-pointer rounded-xl border border-[var(--border-light)] bg-white p-6 transition-all hover:border-emerald-200"
          onClick={() => onSelectInsight?.(rec)}
        >
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
              <div className="mb-3 text-xs font-bold uppercase text-[var(--text-muted)]">Current</div>
              <div className="space-y-2">
                <div><div className="text-xs text-[var(--text-muted)]">Instance</div><div className="text-sm font-semibold text-[var(--text-primary)]">{rec.currentInstance || "N/A"}</div></div>
                <div><div className="text-xs text-[var(--text-muted)]">Avg CPU</div><div className="text-sm font-semibold text-[var(--text-primary)]">{rec.currentCPU ?? "N/A"}%</div></div>
                <div><div className="text-xs text-[var(--text-muted)]">Monthly Cost</div><div className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(rec.currentCost)}</div></div>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="mb-3 text-xs font-bold uppercase text-emerald-700">Recommended</div>
              <div className="space-y-2">
                <div><div className="text-xs text-[var(--text-muted)]">Instance</div><div className="text-sm font-semibold text-emerald-700">{rec.recommendedInstance || "N/A"}</div></div>
                <div><div className="text-xs text-[var(--text-muted)]">Expected Cost</div><div className="text-lg font-bold text-emerald-700">{formatCurrency(rec.recommendedCost)}</div></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border-muted)] pt-4">
            <div>
              <div className="mb-1 text-xs text-[var(--text-muted)]">Estimated Savings</div>
              <div className="text-xl font-bold text-emerald-700">{formatCurrency(rec.savings)}/month</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">
                Risk Level: <span className={`font-medium ${rec.riskLevel === "Low" ? "text-emerald-700" : "text-amber-700"}`}>{rec.riskLevel || "N/A"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Info size={14} />
              <span>Click card to view detailed comparison</span>
            </div>
          </div>

          <div className="mt-4 border-t border-[var(--border-muted)] pt-4 text-xs text-[var(--text-muted)]">
            <span className="font-semibold">Note:</span> Recommendations require implementation through your cloud
            provider management console or infrastructure automation tools.
          </div>
        </div>
      ))}
    </div>
  );
}

export default RightSizingTab;

