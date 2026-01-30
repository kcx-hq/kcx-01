// apps/frontend/src/features/optimization/components/OpportunitiesTab.jsx
import React from "react";
import { motion } from "framer-motion";
import { Target, Info } from "lucide-react";
import { formatCurrency } from "../utils/format";
import { getPriorityColor } from "../utils/helpers";

export function OpportunitiesTab({ opportunities = [], onSelectInsight }) {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-8 text-center">
        <Target size={48} className="text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">No Optimization Opportunities Available</h3>
        <p className="text-sm text-gray-400">
          Insufficient data to generate optimization opportunities.
          Please upload more billing data or check back after more usage history is available.
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
          className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:border-[#a02ff1]/30 transition-all cursor-pointer"
          onClick={() => onSelectInsight?.(opp)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(opp.priority)}`}>
                  {opp.priority || "LOW IMPACT"}
                </span>
                <h3 className="text-lg font-bold text-white">{opp.title || "Untitled Opportunity"}</h3>
              </div>

              <p className="text-sm text-gray-400 mb-4">{opp.description || "No description provided."}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Estimated Monthly Savings</div>
                  <div className="text-xl font-bold text-green-400">{formatCurrency(opp.savings)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Confidence</div>
                  <div className="text-sm font-semibold text-white">{opp.confidence || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Affected Regions</div>
                  <div className="text-sm text-gray-300">
                    {Array.isArray(opp.regions) ? opp.regions.join(", ") : (opp.regions || "N/A")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-white/5">
            <Info size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500">Click to view detailed insight</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
