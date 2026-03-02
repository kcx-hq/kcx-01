import React, { useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpendAnalyticsPayload } from "../../types";
import { formatCurrency } from "../../utils/format";

interface ConcentrationSectionProps {
  concentration: SpendAnalyticsPayload["concentration"];
  concentrationPareto: SpendAnalyticsPayload["concentrationPareto"];
}

const PIE_COLORS = ["#23a282", "#0ea5e9", "#f59e0b", "#23a282", "#64748b", "#ef4444"];

const ConcentrationSection = ({
  concentration,
  concentrationPareto,
}: ConcentrationSectionProps) => {
  const providerChartRows = useMemo(
    () => concentration.paretoByProvider.slice(0, 6),
    [concentration.paretoByProvider]
  );
  const servicePieRows = useMemo(
    () => concentration.paretoByService.slice(0, 6),
    [concentration.paretoByService]
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert size={16} className="text-emerald-700" />
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Concentration & Pareto</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Provider Concentration (Bar + Line)
          </p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={providerChartRows} layout="vertical" margin={{ top: 8, right: 22, left: 12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  labelFormatter={(label) => `Provider: ${String(label)}`}
                  formatter={(value: number, name: string, item: { payload?: { spend?: number } }) =>
                    name === "Share %"
                      ? [`${Number(value).toFixed(2)}% | ${formatCurrency(Number(item?.payload?.spend || 0))}`, "Share"]
                      : [`${Number(value).toFixed(2)}%`, "Cumulative"]
                  }
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="sharePercent" name="Share %" fill="#23a282" radius={[0, 6, 6, 0]} barSize={18}>
                  <LabelList
                    dataKey="sharePercent"
                    position="right"
                    formatter={(value: number) => `${Number(value).toFixed(1)}%`}
                    style={{ fill: "#0f172a", fontSize: 10, fontWeight: 700 }}
                  />
                </Bar>
                <Line
                  type="monotone"
                  dataKey="cumulativeSharePercent"
                  name="Cumulative %"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {!providerChartRows.length ? (
            <p className="mt-2 text-xs font-semibold text-slate-500">No provider concentration data.</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-100 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Service Distribution (Pie)</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={servicePieRows}
                  dataKey="sharePercent"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={2}
                >
                  {servicePieRows.map((row, index) => (
                    <Cell key={`service-pie-${row.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(
                    value: number,
                    _name: string,
                    item: { payload?: { spend?: number; name?: string } }
                  ) => [
                    `${Number(value).toFixed(2)}% (${formatCurrency(Number(item?.payload?.spend || 0))})`,
                    String(item?.payload?.name || "Service"),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {servicePieRows.map((row, index) => (
              <div key={`service-legend-${row.name}`} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="truncate">{row.name}</span>
                </span>
                <span className="shrink-0 font-bold text-slate-700">
                  {row.sharePercent.toFixed(2)}% | {formatCurrency(row.spend)}
                </span>
              </div>
            ))}
            {!servicePieRows.length ? (
              <p className="text-xs font-semibold text-slate-500">No service distribution data.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConcentrationSection;
