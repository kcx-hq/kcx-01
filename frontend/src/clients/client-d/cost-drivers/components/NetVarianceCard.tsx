import React from "react";
import { Activity } from "lucide-react";
import { VarianceBridge } from "../../../../core-dashboard/cost-drivers/components/VarianceBridge";
import { formatCurrency } from "../../../../core-dashboard/cost-drivers/utils/format";
import type { NetVarianceCardProps } from "../types";

export function NetVarianceCard({ overallStats }: NetVarianceCardProps) {
  const isUp = (overallStats?.diff ?? 0) > 0;

  return (
    <div className="bg-[#1a1b20] border border-white/10 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
          <Activity size={14} className="text-[#23a282]" /> Net Variance
        </h3>

        <span
          className={[
            "text-[10px] font-bold px-2 py-1 rounded",
            isUp ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400",
          ].join(" ")}
        >
          {overallStats?.pct ? `${overallStats.pct.toFixed(1)}%` : "0%"}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span
          className={[
            "text-3xl font-mono font-bold",
            isUp ? "text-red-400" : "text-green-400",
          ].join(" ")}
        >
          {isUp ? "+" : ""}
          {formatCurrency(overallStats?.diff)}
        </span>
      </div>

      <div className="w-full">
        <VarianceBridge overallStats={overallStats} />
      </div>
    </div>
  );
}
