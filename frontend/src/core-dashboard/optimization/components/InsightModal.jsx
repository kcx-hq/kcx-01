// apps/frontend/src/features/optimization/components/InsightModal.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import { formatCurrency } from "../utils/format";

export function InsightModal({ selectedInsight, onClose }) {
  return (
    <AnimatePresence>
      {selectedInsight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#1a1b20] border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lightbulb size={20} className="text-[#a02ff1]" />
                {selectedInsight.title || "Insight Details"}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Combined Insight */}
            {selectedInsight.type === "combined-insight" ? (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="text-xs text-blue-400 font-bold mb-2 uppercase">Investigation Summary</div>
                  <div className="text-sm text-gray-300 mb-3">{selectedInsight.summary}</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Resources in Investigation</div>
                      <div className="text-white font-bold">{selectedInsight.selectedCount}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total Monthly Cost</div>
                      <div className="text-green-400 font-bold">{formatCurrency(selectedInsight.totalSavings)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Oldest Idle Resource</div>
                      <div className="text-white font-bold">{selectedInsight.oldestIdle} days</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Services Involved</div>
                      <div className="text-white font-bold">{(selectedInsight.services || []).join(", ")}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-2 font-bold uppercase">Regions</div>
                  <div className="text-sm text-white">{(selectedInsight.regions || []).join(", ")}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-2 font-bold uppercase">Resources in Investigation</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(selectedInsight.resources || []).map((r) => (
                      <div key={r.id} className="bg-[#0f0f11] rounded p-3 text-xs border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-semibold">
                            {r.type} {r.name}
                          </span>
                          <span className="text-green-400 font-bold">{formatCurrency(r.savings)}/mo</span>
                        </div>
                        <div className="text-gray-400">
                          {r.region} • {r.daysIdle} days idle • {r.confidence} confidence
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedInsight.type === "report-preview" ? (
              /* Report Preview */
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="text-xs text-blue-400 font-bold mb-2 uppercase">Report Summary</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Resources Selected</div>
                      <div className="text-white font-bold">{selectedInsight.selectedCount}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total Potential Savings</div>
                      <div className="text-green-400 font-bold">
                        {formatCurrency(selectedInsight.totalSavings)}/month
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="text-xs text-yellow-400 font-bold mb-2">💡 Report Generation</div>
                  <div className="text-sm text-gray-300">
                    This preview shows what would be included in a comprehensive optimization report.
                    Full report generation will be available in the Reporting section.
                  </div>
                </div>

                <button
                  onClick={() => alert("Full report generation will be available in the Reporting section.")}
                  className="w-full px-4 py-2 bg-[#a02ff1] hover:bg-[#8e25d9] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Generate Full Report (Coming Soon)
                </button>
              </div>
            ) : selectedInsight.type === "rightsizing" ? (
              /* Right sizing detail */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0f0f11] rounded-lg p-4 border border-white/5">
                    <div className="text-xs text-gray-500 mb-2">Current Monthly Cost</div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(selectedInsight.currentCost)}</div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                    <div className="text-xs text-gray-500 mb-2">Estimated Optimized Cost</div>
                    <div className="text-2xl font-bold text-green-400">
                      {formatCurrency(selectedInsight.recommendedCost)}
                    </div>
                  </div>
                </div>

                <div className="bg-[#0f0f11] rounded-lg p-4 border border-white/5">
                  <div className="text-xs text-gray-500 mb-2 font-bold uppercase">Assumptions Used</div>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {(selectedInsight.assumptions || []).map((a, idx) => (
                      <li key={idx}>• {a}</li>
                    ))}
                    {(!selectedInsight.assumptions || selectedInsight.assumptions.length === 0) && (
                      <li className="text-gray-500">No assumptions provided.</li>
                    )}
                  </ul>
                </div>

                <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                  <div className="text-xs text-yellow-400 font-bold mb-2">Risk Explanation</div>
                  <div className="text-sm text-gray-300">
                    Risk Level:{" "}
                    <span className="font-semibold text-green-400">{selectedInsight.riskLevel || "N/A"}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    This recommendation is based on historical utilization patterns. Actual performance may vary.
                  </div>
                </div>
              </div>
            ) : (
              /* Default opportunity detail */
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-bold uppercase">📌 What is Detected</div>
                  <div className="text-sm text-white">{selectedInsight.description || "No description provided."}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-2 font-bold uppercase">🔍 Evidence (Data Signals)</div>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {(selectedInsight.evidence || []).map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                    {(!selectedInsight.evidence || selectedInsight.evidence.length === 0) && (
                      <li className="text-gray-500">No evidence provided.</li>
                    )}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0f0f11] rounded-lg p-4 border border-white/5">
                    <div className="text-xs text-gray-500 mb-1">Current Cost Impact</div>
                    <div className="text-lg font-bold text-white">
                      {formatCurrency(selectedInsight.costImpact?.current ?? selectedInsight.savings)}
                      /mo
                    </div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                    <div className="text-xs text-gray-500 mb-1">Optimized Cost Impact</div>
                    <div className="text-lg font-bold text-green-400">
                      {formatCurrency(selectedInsight.costImpact?.optimized ?? 0)}/mo
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-2 font-bold uppercase">🧠 Typical Resolution Paths</div>
                  <div className="text-xs text-gray-400 mb-2 italic">Common approaches teams use to address this:</div>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {(selectedInsight.resolutionPaths || []).map((path, idx) => (
                      <li key={idx}>• {path}</li>
                    ))}
                    {(!selectedInsight.resolutionPaths || selectedInsight.resolutionPaths.length === 0) && (
                      <li className="text-gray-500">No resolution paths provided.</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="text-xs text-gray-400">
                <span className="font-semibold">Implementation:</span> All recommendations require execution through your
                cloud provider's management console or approved infrastructure automation workflows.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
