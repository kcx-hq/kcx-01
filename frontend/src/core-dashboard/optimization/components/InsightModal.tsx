import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import { formatCurrency } from "../utils/format";
import type {
  InsightModalProps,
  Opportunity,
  OptimizationDivClick,
  RightSizingRecommendation,
} from "../types";

export function InsightModal({ selectedInsight, onClose }: InsightModalProps) {
  const isRightSizingInsight = (
    insight: Opportunity | RightSizingRecommendation,
  ): insight is RightSizingRecommendation => insight.type === "rightsizing";

  return (
    <AnimatePresence>
      {selectedInsight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/10 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[var(--border-light)] bg-white p-6"
            onClick={(e: OptimizationDivClick) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--text-primary)]">
                <Lightbulb size={20} className="text-[var(--brand-primary)]" />
                {selectedInsight.title || "Insight Details"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-emerald-50 hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            </div>

            {selectedInsight?.priorityScore !== undefined ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                    <div className="mb-2 text-xs text-[var(--text-muted)]">Monthly Impact</div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {formatCurrency(selectedInsight.monthlyImpact || 0)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                    <div className="mb-2 text-xs text-[var(--text-muted)]">Priority Score</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      {Number(selectedInsight.priorityScore || 0).toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                  <div className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">Execution Context</div>
                  <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                    <li>- Owner: {selectedInsight.ownerTeam || "Unassigned"}</li>
                    <li>- Product: {selectedInsight.ownerProduct || "Unmapped"}</li>
                    <li>- Stage: {selectedInsight.stage || "identified"}</li>
                    <li>- Confidence: {selectedInsight.confidence || "N/A"}</li>
                    <li>- Effort: {selectedInsight.effort || "N/A"} | Risk: {selectedInsight.risk || "N/A"}</li>
                    <li>- ETA: {selectedInsight.etaDate || "N/A"} | Blocked by: {selectedInsight.blockedBy || "None"}</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                  <div className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">Verification Plan</div>
                  <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                    <li>- Claimed: {formatCurrency(selectedInsight.claimedSavings || 0)}</li>
                    <li>- Verified: {formatCurrency(selectedInsight.verifiedSavings || 0)}</li>
                    <li>- Delta: {formatCurrency(selectedInsight.verificationDelta || 0)}</li>
                    <li>- Baseline: 14d pre-change | Compare: 14d post-change</li>
                    <li>- Volume normalization required where unit metric exists</li>
                  </ul>
                </div>
              </div>
            ) : selectedInsight.type === "rightsizing" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                    <div className="mb-2 text-xs text-[var(--text-muted)]">Current Monthly Cost</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      {formatCurrency(selectedInsight.currentCost)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <div className="mb-2 text-xs text-[var(--text-muted)]">Estimated Optimized Cost</div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {formatCurrency(selectedInsight.recommendedCost)}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                  <div className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">Assumptions Used</div>
                  <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                    {(selectedInsight.assumptions || []).map((assumption: string, idx: number) => (
                      <li key={idx}>- {assumption}</li>
                    ))}
                    {(!selectedInsight.assumptions || selectedInsight.assumptions.length === 0) && (
                      <li className="text-[var(--text-muted)]">No assumptions provided.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-2 text-xs font-bold text-amber-700">Risk Explanation</div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    Risk Level:{" "}
                    <span className="font-semibold text-emerald-700">{selectedInsight.riskLevel || "N/A"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">What Is Detected</div>
                  <div className="text-sm text-[var(--text-primary)]">
                    {selectedInsight.description || "No description provided."}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">Evidence (Data Signals)</div>
                  <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                    {(selectedInsight.evidence || []).map((item: string, idx: number) => (
                      <li key={idx}>- {item}</li>
                    ))}
                    {(!selectedInsight.evidence || selectedInsight.evidence.length === 0) && (
                      <li className="text-[var(--text-muted)]">No evidence provided.</li>
                    )}
                  </ul>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                    <div className="mb-1 text-xs text-[var(--text-muted)]">Current Cost Impact</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      {formatCurrency(selectedInsight.costImpact?.current ?? selectedInsight.savings)}/mo
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <div className="mb-1 text-xs text-[var(--text-muted)]">Optimized Cost Impact</div>
                    <div className="text-lg font-bold text-emerald-700">
                      {formatCurrency(selectedInsight.costImpact?.optimized ?? 0)}/mo
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-[var(--border-muted)] pt-4 text-xs text-[var(--text-muted)]">
              <span className="font-semibold">Implementation:</span> Apply recommendations through your cloud
              provider console or approved automation workflows.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default InsightModal;



