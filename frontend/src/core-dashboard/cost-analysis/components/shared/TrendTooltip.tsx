import React from "react";
import type { TooltipProps } from "recharts";
import { formatCurrency, formatDate } from "../../utils/format";

const TrendTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const tooltipDate =
    typeof payload[0]?.payload?.dateLabel === "string"
      ? payload[0]?.payload?.dateLabel
      : String(label ?? "");

  const items = payload
    .filter((entry) => Number(entry.value || 0) !== 0)
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0));

  return (
    <div className="min-w-[220px] rounded-xl border border-slate-700 bg-slate-900 p-3 text-white shadow-xl">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
        {formatDate(tooltipDate)}
      </p>
      <div className="space-y-1.5">
        {items.map((entry, index) => (
          <div key={`${String(entry.name)}-${index}`} className="flex items-center justify-between gap-3">
            <span className="truncate text-[11px] text-slate-200">{entry.name}</span>
            <span className="text-[11px] font-bold">{formatCurrency(Number(entry.value || 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendTooltip;
