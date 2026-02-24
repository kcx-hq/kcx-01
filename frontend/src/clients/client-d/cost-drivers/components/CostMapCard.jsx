import React from "react";
import { LayoutGrid } from "lucide-react";

export function CostMapCard({ showTreeMap, increases, decreases }) {
  return (
    <div className="bg-[#ffffff] border border-slate-200 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
          <LayoutGrid size={12} /> Snapshot
        </h3>
        <span className="text-[10px] text-gray-500">
          {showTreeMap ? "Treemap enabled" : "Dynamics enabled"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-xl border border-slate-200 p-3">
          <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">
            Increases
          </div>
          <div className="text-sm text-slate-800 font-semibold">
            {increases?.length ?? 0} drivers
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Top 10 used in treemap
          </div>
        </div>

        <div className="bg-emerald-50 rounded-xl border border-slate-200 p-3">
          <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">
            Savings
          </div>
          <div className="text-sm text-slate-800 font-semibold">
            {decreases?.length ?? 0} drivers
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Top 10 used in treemap
          </div>
        </div>
      </div>
    </div>
  );
}
