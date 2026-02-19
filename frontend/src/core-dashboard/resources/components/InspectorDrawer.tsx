import React from "react";
import { X, Tag, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency } from "../utils/format";

const InspectorDrawerView = ({
  selectedResource,
  onClose,
  flaggedResources,
  onToggleFlag,
}) => {
  return (
    <AnimatePresence>
      {selectedResource && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-y-0 right-0 z-[70] w-full border-l border-[var(--border-light)] bg-white shadow-2xl md:w-[500px]"
            style={{ top: "64px" }}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between border-b border-[var(--border-light)] bg-[var(--bg-surface)] p-5 md:p-6">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={selectedResource.status} />
                    <span className="text-xs text-[var(--text-muted)]">{selectedResource.service}</span>
                  </div>
                  <h2 className="break-all text-lg font-bold text-[var(--text-primary)]">{selectedResource.id}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-white hover:text-[var(--text-primary)]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                    <p className="mb-1 text-xs font-bold uppercase text-[var(--text-muted)]">Total Cost</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {formatCurrency(selectedResource.totalCost)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                    <p className="mb-1 text-xs font-bold uppercase text-[var(--text-muted)]">Tags Found</p>
                    <p className="text-2xl font-bold text-[var(--brand-primary)]">
                      {selectedResource.tags ? Object.keys(selectedResource.tags).length : 0}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                    <Tag size={12} /> Applied Tags
                  </h3>

                  {selectedResource.hasTags && selectedResource.tags ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedResource.tags).map(([k, v]) => (
                        <span
                          key={k}
                          className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700"
                        >
                          <span className="opacity-60">{k}:</span> {v}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs italic text-[var(--text-muted)]">No tags detected.</div>
                  )}
                </div>

                <div className="mt-4 border-t border-[var(--border-light)] pt-4">
                  <button
                    onClick={() => onToggleFlag(selectedResource.id)}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-xs font-bold transition-colors ${
                      flaggedResources.has(selectedResource.id)
                        ? "border-emerald-200 bg-emerald-50 text-[var(--brand-primary)] hover:bg-emerald-100"
                        : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {flaggedResources.has(selectedResource.id) ? (
                      <>
                        <CheckCircle2 size={14} /> Flagged for Review
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} /> Flag for Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InspectorDrawerView;

