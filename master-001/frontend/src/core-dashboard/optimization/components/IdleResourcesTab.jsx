// apps/frontend/src/features/optimization/components/IdleResourcesTab.jsx
import React from "react";
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
}) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={idleSearch}
              onChange={(e) => setIdleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0f0f11] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#a02ff1]"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={idleFilter}
              onChange={(e) => setIdleFilter(e.target.value)}
              className="px-3 py-2 bg-[#0f0f11] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#a02ff1]"
            >
              <option value="all">All Resources</option>
              <option value="prod">Production Only</option>
              <option value="non-prod">Non-Production Only</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={idleSort}
              onChange={(e) => setIdleSort(e.target.value)}
              className="px-3 py-2 bg-[#0f0f11] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#a02ff1]"
            >
              <option value="savings-desc">Savings: High to Low</option>
              <option value="savings-asc">Savings: Low to High</option>
              <option value="days-desc">Days Idle: Most</option>
              <option value="days-asc">Days Idle: Least</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {!idleResources || idleResources.length === 0 ? (
          <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-8 text-center">
            <Zap size={48} className="text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Idle Resources Detected</h3>
            <p className="text-sm text-gray-400">
              Insufficient data to identify idle resources.
              Please upload more billing data or check back after more usage history is available.
            </p>
          </div>
        ) : filteredIdleResources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No resources found matching your filters.</div>
        ) : (
          filteredIdleResources.map((resource) => {
            const expanded = !!expandedItems[resource.id];
            const confidence = resource.confidence || "Low";

            return (
              <div
                key={resource.id}
                className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-lg p-4 transition-all hover:border-[#a02ff1]/30 cursor-pointer"
                onClick={() => toggleExpand(resource.id)}
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">
                        {resource.type} {resource.name}
                      </span>

                      {/* Confidence */}
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          confidence === "High"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : confidence === "Medium"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {confidence === "High" ? "🟢" : confidence === "Medium" ? "🟡" : "🔴"} {confidence} confidence
                      </span>

                      {/* Risk */}
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          resource.risk === "Prod"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {resource.risk || "Non-prod"}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">
                      {resource.status || "Unknown"} • {resource.daysIdle || 0} days idle • {resource.utilization || "N/A"} utilization
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-green-400">{formatCurrency(resource.savings)}/mo</div>
                    <div className="text-xs text-gray-500 mt-1">Click to expand</div>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-white/5 space-y-4 overflow-hidden"
                    >
                      <div>
                        <div className="text-xs text-gray-500 mb-2 font-bold uppercase">
                          Why This Resource Is Classified as Idle
                        </div>
                        <div className="text-sm text-gray-300">{resource.whyFlagged || "No reason provided."}</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Duration of Inactivity</div>
                          <div className="text-sm text-white font-semibold">{resource.daysIdle || 0} days</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Estimated Monthly Waste</div>
                          <div className="text-sm text-green-400 font-semibold">{formatCurrency(resource.savings)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Confidence Level</div>
                          <div className="text-sm text-white">
                            {confidence === "High" ? "🟢" : confidence === "Medium" ? "🟡" : "🔴"} {confidence}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Risk Note</div>
                          <div className="text-sm text-white">{resource.risk || "Non-prod"} Environment</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Last Activity</div>
                          <div className="text-sm text-white">{resource.lastActivity || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Region</div>
                          <div className="text-sm text-white">{resource.region || "N/A"}</div>
                        </div>
                      </div>

                      <div className="bg-[#0f0f11] rounded-lg p-4 border border-white/5">
                        <div className="text-xs text-gray-500 mb-3 font-bold uppercase">Common Actions Teams Usually Take</div>
                        <ul className="space-y-2">
                          {(resource.typicalResolutionPaths || []).map((action, idx) => (
                            <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                              <span className="text-[#a02ff1] mt-1">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                          {(!resource.typicalResolutionPaths || resource.typicalResolutionPaths.length === 0) && (
                            <li className="text-sm text-gray-500">No suggested actions provided.</li>
                          )}
                        </ul>
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
