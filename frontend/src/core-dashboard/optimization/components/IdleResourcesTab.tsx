import React from "react";
import type {
  IdleResource,
  IdleResourcesTabProps,
  OptimizationInputChange,
  OptimizationSelectChange,
} from "../types";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Filter, Search, Zap } from "lucide-react";
import { formatCurrency } from "../utils/format";

export function IdleResourcesTab({
  idleResources = [],
  filteredIdleResources = [],
  expandedItems = {},
  toggleExpand,
  idleSearch,
  setIdleSearch,
  idleFilter,
  setIdleFilter,
  idleSort,
  setIdleSort,
}: IdleResourcesTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border-light)] bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search resources..."
              value={idleSearch}
              onChange={(e: OptimizationInputChange) => setIdleSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-emerald-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[var(--text-muted)]" />
            <select
              value={idleFilter}
              onChange={(e: OptimizationSelectChange) => setIdleFilter(e.target.value as "all" | "prod" | "non-prod")}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-emerald-200"
            >
              <option value="all">All Resources</option>
              <option value="prod">Production Only</option>
              <option value="non-prod">Non-Production Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={idleSort}
              onChange={(e: OptimizationSelectChange) => setIdleSort(e.target.value as "savings-desc" | "savings-asc" | "days-desc" | "days-asc")}
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-emerald-200"
            >
              <option value="savings-desc">Savings: High to Low</option>
              <option value="savings-asc">Savings: Low to High</option>
              <option value="days-desc">Days Idle: Most</option>
              <option value="days-asc">Days Idle: Least</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {!idleResources || idleResources.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-light)] bg-white p-8 text-center">
            <Zap size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
            <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">No Idle Resources Detected</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Insufficient data to identify idle resources. Upload more billing data
              or check back after more usage history is available.
            </p>
          </div>
        ) : filteredIdleResources.length === 0 ? (
          <div className="py-8 text-center text-[var(--text-muted)]">No resources found matching your filters.</div>
        ) : (
          filteredIdleResources.map((resource: IdleResource) => {
            const expanded = !!expandedItems[resource.id];
            const confidence = resource.confidence || "Low";

            return (
              <div
                key={resource.id}
                className="cursor-pointer rounded-lg border border-[var(--border-light)] bg-white p-4 transition-all hover:border-emerald-200"
                onClick={() => toggleExpand(resource.id)}
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    size={16}
                    className={`text-[var(--text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
                  />

                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {resource.type} {resource.name}
                      </span>

                      <span
                        className={`rounded border px-2 py-0.5 text-xs font-medium ${
                          confidence === "High"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : confidence === "Medium"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {confidence} confidence
                      </span>

                      <span
                        className={`rounded border px-2 py-0.5 text-xs font-medium ${
                          resource.risk === "Prod"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {resource.risk || "Non-prod"}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--text-muted)]">
                      {resource.status || "Unknown"} · {resource.daysIdle || 0} days idle · {resource.utilization || "N/A"} utilization
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-700">{formatCurrency(resource.savings)}/mo</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">Click to expand</div>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 overflow-hidden border-t border-[var(--border-muted)] pt-4"
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">
                            Why This Resource Is Classified as Idle
                          </div>
                          <div className="text-sm text-[var(--text-secondary)]">{resource.whyFlagged || "No reason provided."}</div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div><div className="text-xs text-[var(--text-muted)]">Duration of Inactivity</div><div className="text-sm font-semibold text-[var(--text-primary)]">{resource.daysIdle || 0} days</div></div>
                          <div><div className="text-xs text-[var(--text-muted)]">Estimated Monthly Waste</div><div className="text-sm font-semibold text-emerald-700">{formatCurrency(resource.savings)}</div></div>
                          <div><div className="text-xs text-[var(--text-muted)]">Confidence Level</div><div className="text-sm text-[var(--text-primary)]">{confidence}</div></div>
                          <div><div className="text-xs text-[var(--text-muted)]">Risk Note</div><div className="text-sm text-[var(--text-primary)]">{resource.risk || "Non-prod"} Environment</div></div>
                          <div><div className="text-xs text-[var(--text-muted)]">Last Activity</div><div className="text-sm text-[var(--text-primary)]">{resource.lastActivity || "N/A"}</div></div>
                          <div><div className="text-xs text-[var(--text-muted)]">Region</div><div className="text-sm text-[var(--text-primary)]">{resource.region || "N/A"}</div></div>
                        </div>

                        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
                          <div className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">Common Actions Teams Usually Take</div>
                          <ul className="space-y-2">
                            {(resource.typicalResolutionPaths || []).map((action: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                <span className="mt-1 text-[var(--brand-primary)]">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                            {(!resource.typicalResolutionPaths || resource.typicalResolutionPaths.length === 0) && (
                              <li className="text-sm text-[var(--text-muted)]">No suggested actions provided.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default IdleResourcesTab;




