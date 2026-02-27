// frontend/clients/client-d/dashboards/overview/data-explorer/components/PivotView.jsx
import React from "react";
import { Layers } from "lucide-react";
import PremiumGate from "../../../../core-dashboard/common/PremiumGate";
import type { PivotViewProps } from "../types";

const PivotView = ({ isLocked, groupByCol, clientSideGroupedData, handleDrillDown }: PivotViewProps) => {
  return (
    <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-700">
      {isLocked ? (
        <PremiumGate variant="full">
          <div className="h-full" />
        </PremiumGate>
      ) : groupByCol ? (
        <table className="min-w-full border-collapse text-xs text-left">
          <thead className="bg-[#1b1c22] text-gray-400 font-bold sticky top-0 z-20 shadow-lg">
            <tr>
              <th className="px-4 py-3 border-b border-white/10 text-[#007758]">
                {groupByCol} (Group)
              </th>
              <th className="px-4 py-3 border-b border-white/10 text-right">Count</th>
              <th className="px-4 py-3 border-b border-white/10 text-right">Total Cost</th>
              <th className="px-4 py-3 border-b border-white/10 w-52">Distribution</th>
            </tr>
          </thead>
          <tbody>
            {clientSideGroupedData.map((group, idx: number) => (
              <tr
                key={idx}
                onClick={() => handleDrillDown(group)}
                className="border-b border-white/5 hover:bg-[#007758]/10 cursor-pointer transition-colors bg-[#121319]"
              >
                <td className="px-4 py-3 font-medium text-white">{group.name}</td>
                <td className="px-4 py-3 text-right text-gray-300">
                  {group.count.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#007758]">
                  $
                  {group.totalCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-[#007758]" style={{ width: `${group.percent}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 w-10 text-right">
                      {group.percent.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          <Layers size={46} className="mb-4 opacity-50" />
          <p>Select a column from “Group by” to build a pivot view.</p>
        </div>
      )}
    </div>
  );
};

export default PivotView;
