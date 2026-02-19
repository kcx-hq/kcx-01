import React from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { formatCurrency } from "../utils/format";
import { getPriorityColor } from "../utils/helpers";

export function OpportunitiesTab({ opportunities = [], onSelectInsight }) {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-light)] bg-white p-8 text-center">
        <Target size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
        <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">No Optimization Opportunities Available</h3>
        <p className="text-sm text-[var(--text-muted)]">
          Insufficient data to generate optimization opportunities. Upload more billing data
          or check back after more usage history is available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {opportunities.map((opp, index) => (
        <motion.div
          key={opp.id ?? `${opp.title}-${index}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="cursor-pointer rounded-xl border border-[var(--border-light)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm"
          onClick={() => onSelectInsight?.(opp)}
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getPriorityColor(opp.priority)}`}>
                  {opp.priority || "LOW IMPACT"}
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{opp.title || "Untitled Opportunity"}</h3>
              </div>

              <p className="mb-4 text-sm text-[var(--text-secondary)]">{opp.description || "No description provided."}</p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <div className="mb-1 text-xs text-[var(--text-muted)]">Estimated Monthly Savings</div>
                  <div className="text-xl font-bold text-emerald-700">{formatCurrency(opp.savings)}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-[var(--text-muted)]">Confidence</div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{opp.confidence || "N/A"}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-[var(--text-muted)]">Affected Regions</div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {Array.isArray(opp.regions) ? opp.regions.join(", ") : (opp.regions || "N/A")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default OpportunitiesTab;

