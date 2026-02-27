import { X, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../utils/format";
import type { IssueInspectorProps } from "../types";

const explainIssue = (issue: string) => {
  if (issue === "Untagged") return " Missing allocation tags. Cost cannot be assigned.";
  if (issue === "Missing ID") return " Resource ID is null. Cannot track lifecycle.";
  if (issue === "Missing Service") return " Service Name is null.";
  return " Value is suspiciously low or negative.";
};

const IssueInspector = ({ selectedIssue, setSelectedIssue }: IssueInspectorProps) => {
  const issues = selectedIssue?._issues ?? [];

  return (
    <AnimatePresence>
      {selectedIssue && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIssue(null)}
            className="fixed inset-x-0 bottom-0 top-8 z-40 bg-black/35 backdrop-blur-sm md:top-10"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed bottom-0 right-0 top-8 z-50 w-full border-l border-[var(--border-light)] bg-white shadow-2xl md:top-10 md:w-[500px]"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between border-b border-[var(--border-light)] bg-[var(--bg-surface)] p-5 md:p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Issue Inspector
                  </span>
                  <h2 className="mt-1 break-all text-xl font-bold text-[var(--text-primary)]">
                    {selectedIssue?.ResourceId || "Unknown Resource"}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="rounded-full p-2 transition-colors hover:bg-white"
                >
                  <X size={20} className="text-[var(--text-muted)]" />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-6">
                {issues.length > 0 ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-rose-700">
                      <AlertTriangle size={14} /> Diagnosis
                    </h3>
                    <ul className="list-inside list-disc space-y-2 text-xs text-[var(--text-secondary)]">
                      {issues.map((issue: string) => (
                        <li key={issue}>
                          <strong className="text-[var(--text-primary)]">{issue}:</strong>
                          {explainIssue(issue)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                    <CheckCircle size={16} /> No Quality Issues Detected.
                  </div>
                )}

                <div>
                  <h3 className="mb-2 text-sm font-bold text-[var(--text-primary)]">Record Details</h3>
                  <div className="divide-y divide-[var(--border-muted)] overflow-hidden rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)]">
                    {["ServiceName", "RegionName", "UsageType", "Operation"].map((k: string) => (
                      <div key={k} className="flex justify-between p-3 text-xs">
                        <span className="text-[var(--text-muted)]">{k}</span>
                        <span className="text-right font-mono text-[var(--text-secondary)]">
                          {String(selectedIssue?.[k] || "--")}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between bg-white p-3 text-xs">
                      <span className="font-bold text-[var(--text-muted)]">Billed Cost</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {formatCurrency(selectedIssue?._parsedCost || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IssueInspector;



