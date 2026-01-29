// apps/frontend/src/features/optimization/components/RightSizingTab.jsx
import React from "react";
import { TrendingDown, Info } from "lucide-react";
import { formatCurrency } from "../utils/format";

export function RightSizingTab({ rightSizingRecs = [], onSelectInsight }) {
  if (!rightSizingRecs || rightSizingRecs.length === 0) {
    return (
      <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-8 text-center">
        <TrendingDown size={48} className="text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">No Right-Sizing Recommendations</h3>
        <p className="text-sm text-gray-400">
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
          className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:border-[#a02ff1]/30 transition-all cursor-pointer"
          onClick={() => onSelectInsight?.(rec)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Current */}
            <div className="bg-[#0f0f11] rounded-lg p-4 border border-white/5">
              <div className="text-xs text-gray-500 mb-3 font-bold uppercase">Current</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Instance</div>
                  <div className="text-sm font-semibold text-white">{rec.currentInstance || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Avg CPU</div>
                  <div className="text-sm font-semibold text-white">{rec.currentCPU ?? "N/A"}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Monthly Cost</div>
                  <div className="text-lg font-bold text-white">{formatCurrency(rec.currentCost)}</div>
                </div>
              </div>
            </div>

            {/* Recommended */}
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
              <div className="text-xs text-green-400 mb-3 font-bold uppercase">Recommended</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Instance</div>
                  <div className="text-sm font-semibold text-green-400">{rec.recommendedInstance || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Expected Cost</div>
                  <div className="text-lg font-bold text-green-400">{formatCurrency(rec.recommendedCost)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div>
              <div className="text-xs text-gray-500 mb-1">Estimated Savings</div>
              <div className="text-xl font-bold text-green-400">{formatCurrency(rec.savings)}/month</div>
              <div className="text-xs text-gray-400 mt-1">
                Risk Level:{" "}
                <span className={`font-medium ${rec.riskLevel === "Low" ? "text-green-400" : "text-yellow-400"}`}>
                  {rec.riskLevel || "N/A"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Info size={14} />
              <span>Click card to view detailed comparison</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="text-xs text-gray-400">
              <span className="font-semibold">Note:</span> Recommendations require implementation through your cloud provider's
              management console or infrastructure automation tools.
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
