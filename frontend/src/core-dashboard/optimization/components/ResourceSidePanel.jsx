import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { formatCurrency } from "../utils/format";

export function ResourceSidePanel({ selectedResource, onClose }) {
  return (
    <AnimatePresence>
      {selectedResource && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/10 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="ml-auto h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--border-light)] bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)] md:text-xl">
                {selectedResource.type} {selectedResource.name}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-emerald-50 hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-3 text-xs font-bold uppercase text-[var(--text-muted)]">Why It Is Flagged</div>
                <div className="space-y-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                  <div>
                    <div className="mb-1 text-xs text-[var(--text-muted)]">Idle Duration</div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{selectedResource.daysIdle || 0} days</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-[var(--text-muted)]">Utilization Signal Used</div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {selectedResource.utilizationSignal || selectedResource.utilization || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-[var(--text-muted)]">Details</div>
                    <div className="text-sm text-[var(--text-secondary)]">{selectedResource.whyFlagged || "N/A"}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 text-xs font-bold uppercase text-[var(--text-muted)]">Cost Context</div>
                <div className="space-y-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                  <div>
                    <div className="mb-1 text-xs text-[var(--text-muted)]">Monthly Cost</div>
                    <div className="text-lg font-bold text-emerald-700">{formatCurrency(selectedResource.savings)}</div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 text-xs text-[var(--text-muted)]">% of Service Spend</div>
                      <div className="text-sm text-[var(--text-primary)]">{selectedResource.serviceSpendPercent ?? "N/A"}%</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-[var(--text-muted)]">% of Region Spend</div>
                      <div className="text-sm text-[var(--text-primary)]">{selectedResource.regionSpendPercent ?? "N/A"}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 text-xs font-bold uppercase text-[var(--text-muted)]">Typical Resolution Paths</div>
                <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                  <ul className="space-y-2">
                    {(selectedResource.typicalResolutionPaths || []).map((path, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="mt-1 text-[var(--brand-primary)]">-</span>
                        <span>{path}</span>
                      </li>
                    ))}
                    {(!selectedResource.typicalResolutionPaths || selectedResource.typicalResolutionPaths.length === 0) && (
                      <li className="text-sm text-[var(--text-muted)]">No resolution paths provided.</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="border-t border-[var(--border-muted)] pt-4 text-xs text-[var(--text-muted)]">
                This is a read-only view. Apply changes in your cloud console or automation pipelines.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ResourceSidePanel;
