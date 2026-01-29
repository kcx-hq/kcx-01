import React from "react";
import { Briefcase } from "lucide-react";
import { formatCurrency } from "../utils/format";

export function InsightsGrid({ insights }) {
  return (
    <div className="bg-[#1a1b20] border border-white/10 rounded-xl p-6 shadow-lg">
      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Briefcase size={16} className="text-[#a02ff1]" />
        Ownership Insights
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#0f0f11] border border-white/5 rounded-lg p-4">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total Accounts</p>
          <p className="text-2xl font-bold text-white">{insights.totalAccounts || 0}</p>
        </div>

        <div className="bg-[#0f0f11] border border-white/5 rounded-lg p-4">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">With Assigned Owners</p>
          <p className="text-2xl font-bold text-green-400">{insights.accountsWithOwner || 0}</p>
          <p className="text-[9px] text-gray-600 mt-1">(inferred)</p>
        </div>

        <div className="bg-[#0f0f11] border border-red-500/30 rounded-lg p-4">
          <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider mb-1">Without Owners</p>
          <p className="text-2xl font-bold text-red-400">{insights.accountsWithoutOwner || 0}</p>
          <p className="text-[9px] text-gray-600 mt-1">(no tag detected)</p>
        </div>

        <div className="bg-[#0f0f11] border border-orange-500/30 rounded-lg p-4">
          <p className="text-[10px] text-orange-400 uppercase font-bold tracking-wider mb-1">Spend Unattributed</p>
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(insights.spendWithoutOwner || 0)}</p>
        </div>

        <div className="bg-[#0f0f11] border border-orange-500/30 rounded-lg p-4">
          <p className="text-[10px] text-orange-400 uppercase font-bold tracking-wider mb-1">% Unattributed</p>
          <p className="text-2xl font-bold text-orange-400">
            {Number(insights.spendUnattributedPercent || 0).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
