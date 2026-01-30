import React from "react";
import {
  LayoutGrid,
  BarChart2,
  PlusCircle,
  TrendingUp,
  ArrowDownRight,
  Trash2,
} from "lucide-react";
import { ResponsiveContainer, Treemap } from "recharts";
import { formatCurrency } from "../../../../core-dashboard/cost-drivers/utils/format";

export function DynamicsCard({
  showTreeMap,
  setShowTreeMap,
  increases,
  decreases,
  dynamics,
}) {
  return (
    <div className="bg-[#1a1b20] border border-white/10 rounded-2xl p-4 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
          {showTreeMap ? <LayoutGrid size={12} /> : <BarChart2 size={12} />}
          {showTreeMap ? "Cost Map" : "Dynamics"}
        </h3>

        <button
          onClick={() => setShowTreeMap((p) => !p)}
          className={[
            "p-1.5 rounded-lg transition-all border",
            showTreeMap
              ? "bg-[#a02ff1] text-white border-[#a02ff1]"
              : "bg-black/40 hover:bg-black/60 text-gray-400 hover:text-gray-200 border-white/10",
          ].join(" ")}
          title="Toggle View"
        >
          {showTreeMap ? <BarChart2 size={14} /> : <LayoutGrid size={14} />}
        </button>
      </div>

      {showTreeMap ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={[...increases.slice(0, 10), ...decreases.slice(0, 10)].map((item) => ({
                name: item.name,
                value: Math.abs(item.diff),
                fill: item.diff > 0 ? "#ef4444" : "#10b981",
              }))}
              dataKey="value"
              stroke="#1a1b20"
              fill="#8884d8"
            />
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Metric label="New" icon={<PlusCircle size={10} />} tone="text-blue-400" value={formatCurrency(dynamics?.newSpend)} />
          <Metric label="Growth" icon={<TrendingUp size={10} />} tone="text-red-400" value={formatCurrency(dynamics?.expansion)} />
          <Metric label="Saved" icon={<ArrowDownRight size={10} />} tone="text-green-400" value={formatCurrency(dynamics?.optimization)} />
          <Metric label="Gone" icon={<Trash2 size={10} />} tone="text-gray-400" value={formatCurrency(dynamics?.deleted)} />
        </div>
      )}
    </div>
  );
}

function Metric({ label, icon, tone, value }) {
  return (
    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
      <div className={`flex items-center gap-1.5 ${tone} mb-1`}>
        {icon}
        <span className="text-[9px] font-bold uppercase">{label}</span>
      </div>
      <span className="text-sm font-mono font-bold text-white">{value}</span>
    </div>
  );
}
