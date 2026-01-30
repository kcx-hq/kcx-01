// apps/frontend/src/features/optimization/components/ResourceSidePanel.jsx
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="bg-[#1a1b20] border border-white/10 rounded-xl p-6 w-full max-w-md h-[90vh] overflow-y-auto ml-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {selectedResource.type} {selectedResource.name}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Section 1 */}
              <div>
                <div className="text-xs text-gray-500 mb-3 font-bold uppercase">Why It's Flagged</div>
                <div className="bg-[#0f0f11] rounded-lg p-4 border border-white/5 space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Idle Duration</div>
                    <div className="text-sm text-white font-semibold">{selectedResource.daysIdle || 0} days</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Utilization Signal Used</div>
                    <div className="text-sm text-gray-300">
                      {selectedResource.utilizationSignal || selectedResource.utilization || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Confidence Level</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedResource.confidence === "High"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : selectedResource.confidence === "Medium"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {selectedResource.confidence === "High"
                          ? "🟢"
                          : selectedResource.confidence === "Medium"
                          ? "🟡"
                          : "🔴"}{" "}
                        {selectedResource.confidence || "Low"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Details</div>
                    <div className="text-sm text-gray-300">{selectedResource.whyFlagged || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <div className="text-xs text-gray-500 mb-3 font-bold uppercase">Cost Context</div>
                <div className="bg-[#0f0f11] rounded-lg p-4 border border-white/5 space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Monthly Cost</div>
                    <div className="text-lg font-bold text-green-400">{formatCurrency(selectedResource.savings)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">% of Service Spend</div>
                      <div className="text-sm text-white">{selectedResource.serviceSpendPercent ?? "N/A"}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">% of Region Spend</div>
                      <div className="text-sm text-white">{selectedResource.regionSpendPercent ?? "N/A"}%</div>
                    </div>
                  </div>

                  {Array.isArray(selectedResource.costHistory) && selectedResource.costHistory.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Cost History (Last 4 Months)</div>
                      <div className="flex items-end gap-2 h-16">
                        {selectedResource.costHistory.map((cost, idx) => {
                          const max = Math.max(...selectedResource.costHistory);
                          const h = max > 0 ? (cost / max) * 100 : 0;
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center">
                              <div className="w-full bg-green-500/30 rounded-t" style={{ height: `${h}%` }} />
                              <div className="text-[10px] text-gray-500 mt-1">{formatCurrency(cost)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3 */}
              <div>
                <div className="text-xs text-gray-500 mb-3 font-bold uppercase">Typical Resolution Paths</div>
                <div className="bg-[#0f0f11] rounded-lg p-4 border border-white/5">
                  <div className="text-xs text-gray-400 mb-2 italic">Teams usually resolve this by:</div>
                  <ul className="space-y-2">
                    {(selectedResource.typicalResolutionPaths || []).map((path, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-[#a02ff1] mt-1">•</span>
                        <span>{path}</span>
                      </li>
                    ))}
                    {(!selectedResource.typicalResolutionPaths || selectedResource.typicalResolutionPaths.length === 0) && (
                      <li className="text-sm text-gray-500">No resolution paths provided.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Section 4 */}
              <div>
                <div className="text-xs text-gray-500 mb-3 font-bold uppercase">Risk Notes</div>
                <div className="bg-[#0f0f11] rounded-lg p-4 border border-white/5 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Environment</div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedResource.risk === "Prod"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {selectedResource.risk || "Non-prod"}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Tagged Owner</div>
                      <div className="text-sm text-white">{selectedResource.owner || "Not assigned"}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Last Activity Timestamp</div>
                    <div className="text-sm text-white">{selectedResource.lastActivity || "N/A"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Region</div>
                    <div className="text-sm text-white">{selectedResource.region || "N/A"}</div>
                  </div>

                  {Array.isArray(selectedResource.tags) && selectedResource.tags.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedResource.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 text-xs text-gray-500">
                This is a read-only view. Apply changes in your cloud console or automation pipelines.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
