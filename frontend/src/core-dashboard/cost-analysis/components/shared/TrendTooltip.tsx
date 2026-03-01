import React from "react";
import type { TooltipProps } from "recharts";
import { formatCurrency, formatDate } from "../../utils/format";
import { formatSignedPercent } from "../../utils/view.helpers";

const TrendTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const rawPoint = payload[0]?.payload as Record<string, unknown> | undefined;
  const total = Number(rawPoint?.total || 0);
  const previous = Number(rawPoint?.previousTotal || 0);
  const deltaValue = total - previous;
  const deltaPercent = previous > 0 ? (deltaValue / previous) * 100 : 0;
  const isAnomaly = Boolean(rawPoint?.isAnomaly);
  const anomalyImpact = Number(rawPoint?.anomalyImpact || 0);

  const tooltipDate =
    typeof payload[0]?.payload?.dateLabel === "string"
      ? payload[0]?.payload?.dateLabel
      : String(label ?? "");

  const topContributors = payload
    .filter((entry) => {
      const key = String(entry.dataKey || "");
      return key !== "total" && key !== "previousTotal" && Number(entry.value || 0) > 0;
    })
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0));

  return (
    <div className="min-w-[240px] rounded-xl border border-emerald-100 bg-white p-3 text-slate-800 shadow-xl">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {formatDate(tooltipDate)}
      </p>

      <div className="mb-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-600">Current</span>
          <span className="font-black text-slate-900">{formatCurrency(total)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-600">Previous</span>
          <span className="font-bold text-slate-700">{formatCurrency(previous)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-600">Delta</span>
          <span className={`font-bold ${deltaValue >= 0 ? "text-rose-700" : "text-emerald-700"}`}>
            {formatSignedPercent(deltaPercent)} ({deltaValue >= 0 ? "+" : ""}{formatCurrency(deltaValue)})
          </span>
        </div>
      </div>

      {isAnomaly ? (
        <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">
          Anomaly detected | impact {formatCurrency(anomalyImpact)}
        </div>
      ) : null}

      <div className="space-y-1.5">
        {topContributors.slice(0, 4).map((entry, index) => (
          <div key={`${String(entry.name)}-${index}`} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: String(entry.color || "#64748b") }} />
              {entry.name}
            </span>
            <span className="text-[11px] font-bold">{formatCurrency(Number(entry.value || 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendTooltip;
