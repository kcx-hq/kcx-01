import React, { useEffect, useMemo, useState } from "react";
import { Gauge, TrendingUp } from "lucide-react";
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BreakdownRow, SpendAnalyticsFilters } from "../../types";
import { formatCurrency } from "../../utils/format";
import { formatControlLabel, formatPercent } from "../../utils/view.helpers";
import type { BreakdownSectionState, NormalizedChart } from "./types";
import TrendTooltip from "../shared/TrendTooltip";

interface TrendBreakdownSectionProps {
  compareLabel: string;
  trendSeries: Array<Record<string, string | number | boolean | undefined>>;
  normalizedChart: NormalizedChart;
  legendSeriesKeys: string[];
  hiddenSeries: Set<string>;
  palette: string[];
  breakdownState: BreakdownSectionState;
  breakdownListRef: React.RefObject<HTMLDivElement | null>;
  filters: SpendAnalyticsFilters;
  onToggleSeries: (key: string) => void;
  onResetBreakdownFilters: () => void;
  onSetBreakdownTab: (tab: BreakdownSectionState["tab"]) => void;
  onApplyBreakdownFilter: (row: BreakdownRow) => void;
}

const TrendBreakdownSection = ({
  compareLabel,
  trendSeries,
  normalizedChart,
  legendSeriesKeys,
  hiddenSeries,
  palette,
  breakdownState,
  breakdownListRef,
  filters,
  onToggleSeries,
  onResetBreakdownFilters,
  onSetBreakdownTab,
  onApplyBreakdownFilter,
}: TrendBreakdownSectionProps) => {
  const { rows: breakdownRows, tab: breakdownTab, tabLabel, activeFilterValue, tabs, filterMap } = breakdownState;
  const [breakdownQuery, setBreakdownQuery] = useState<string>("");
  const [breakdownSort, setBreakdownSort] = useState<
    "spend_desc" | "delta_abs_desc" | "delta_desc" | "delta_asc" | "share_desc"
  >("spend_desc");
  const [breakdownTopN, setBreakdownTopN] = useState<"5" | "10" | "20" | "all">("10");
  const [brushWindow, setBrushWindow] = useState<{ start: number; end: number }>({
    start: 0,
    end: Math.max(0, normalizedChart.rows.length - 1),
  });

  useEffect(() => {
    setBrushWindow({
      start: 0,
      end: Math.max(0, normalizedChart.rows.length - 1),
    });
  }, [normalizedChart.rows.length]);

  const anomalyIndexes = useMemo(
    () =>
      normalizedChart.rows
        .map((row, index) => (Boolean(row.isAnomaly) ? index : -1))
        .filter((index) => index >= 0),
    [normalizedChart.rows]
  );

  const applyAnomalyFocus = (): void => {
    if (anomalyIndexes.length === 0) return;
    const first = Math.max(0, anomalyIndexes[0] - 3);
    const last = Math.min(
      Math.max(0, normalizedChart.rows.length - 1),
      anomalyIndexes[anomalyIndexes.length - 1] + 3
    );
    setBrushWindow({ start: first, end: last });
  };

  const visibleBreakdownRows = useMemo(() => {
    const query = breakdownQuery.trim().toLowerCase();
    let rows = breakdownRows;
    if (query) {
      rows = rows.filter((row) => row.name.toLowerCase().includes(query));
    }
    rows = [...rows].sort((a, b) => {
      if (breakdownSort === "delta_abs_desc") return Math.abs(b.deltaValue) - Math.abs(a.deltaValue);
      if (breakdownSort === "delta_desc") return b.deltaValue - a.deltaValue;
      if (breakdownSort === "delta_asc") return a.deltaValue - b.deltaValue;
      if (breakdownSort === "share_desc") return b.sharePercent - a.sharePercent;
      return b.spend - a.spend;
    });
    if (breakdownTopN === "all") return rows;
    return rows.slice(0, Number(breakdownTopN));
  }, [breakdownRows, breakdownQuery, breakdownSort, breakdownTopN]);

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm min-w-0 h-[600px] flex flex-col overflow-hidden md:col-span-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-700" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Primary Spend Trend</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Compare: {formatControlLabel(compareLabel)}
            </span>
            <button
              type="button"
              onClick={applyAnomalyFocus}
              disabled={anomalyIndexes.length === 0}
              className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                anomalyIndexes.length === 0
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              Focus anomalies
            </button>
            <button
              type="button"
              onClick={() =>
                setBrushWindow({
                  start: 0,
                  end: Math.max(0, normalizedChart.rows.length - 1),
                })
              }
              className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-200"
            >
              Reset zoom
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {normalizedChart.rows.length} points
          </span>
          {legendSeriesKeys.length > 0 ? (
            legendSeriesKeys.map((key, index) => {
              const isHidden = hiddenSeries.has(key);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => onToggleSeries(key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                    isHidden
                      ? "border-slate-200 bg-slate-50 text-slate-400"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                  {key}
                </button>
              );
            })
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total only
            </span>
          )}
        </div>

        {trendSeries.length === 0 ? (
          <div className="flex flex-1 min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
            No trend data available for selected filters.
          </div>
        ) : (
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={normalizedChart.rows} margin={{ top: 16, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="idx"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value) => {
                    const row = normalizedChart.rows.find((item) => Number(item.idx) === Number(value));
                    return String(row?.dateLabel ?? "").slice(5);
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value) => `$${Number(value).toLocaleString("en-US")}`}
                  domain={[0, (dataMax: number) => (Number.isFinite(dataMax) ? Math.max(dataMax * 1.1, 1) : 1)]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TrendTooltip />} />

                {normalizedChart.series.map((item) => (
                  <Area
                    key={item.safeKey}
                    type="monotone"
                    dataKey={item.safeKey}
                    name={item.label}
                    stackId="spend"
                    stroke={item.color}
                    fill={item.color}
                    fillOpacity={0.2}
                    strokeWidth={1.8}
                  />
                ))}

                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#0f172a"
                  strokeWidth={2.5}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="previousTotal"
                  stroke="#334155"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name={compareLabel}
                />

                {normalizedChart.rows
                  .filter((point) => Boolean(point.isAnomaly))
                  .map((point) => (
                    <ReferenceDot
                      key={`anomaly-${String(point.date)}`}
                      x={point.idx}
                      y={point.total}
                      r={5}
                      fill="#ef4444"
                      stroke="#7f1d1d"
                    />
                  ))}
                <Brush
                  dataKey="idx"
                  height={20}
                  travellerWidth={8}
                  stroke="#0f766e"
                  startIndex={brushWindow.start}
                  endIndex={brushWindow.end}
                  onChange={(range) => {
                    if (typeof range?.startIndex !== "number" || typeof range?.endIndex !== "number") return;
                    setBrushWindow({ start: range.startIndex, end: range.endIndex });
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm min-w-0 h-[600px] flex flex-col overflow-hidden md:col-span-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-emerald-700" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Breakdown Panel</h2>
          </div>
          <button
            onClick={onResetBreakdownFilters}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
          >
            Reset
          </button>
        </div>

        <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Breakdown By</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">{tabLabel}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Filter</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                activeFilterValue !== "All" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
              }`}
            >
              {String(activeFilterValue || "All")}
            </span>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const field = filterMap[tab.key];
            const isApplied = filters[field] !== "All";

            return (
              <button
                key={tab.key}
                onClick={() => onSetBreakdownTab(tab.key)}
                className={`rounded-lg px-2 py-1 text-[10px] uppercase tracking-wider transition-all ${
                  tab.key === breakdownTab
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-400 font-black shadow-sm"
                    : isApplied
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={breakdownQuery}
            onChange={(event) => setBreakdownQuery(event.target.value)}
            placeholder={`Search ${tabLabel}`}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={breakdownSort}
              onChange={(event) =>
                setBreakdownSort(
                  event.target.value as
                    | "spend_desc"
                    | "delta_abs_desc"
                    | "delta_desc"
                    | "delta_asc"
                    | "share_desc"
                )
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="spend_desc">Spend</option>
              <option value="delta_abs_desc">Abs delta</option>
              <option value="delta_desc">Inc first</option>
              <option value="delta_asc">Dec first</option>
              <option value="share_desc">Share</option>
            </select>
            <select
              value={breakdownTopN}
              onChange={(event) => setBreakdownTopN(event.target.value as "5" | "10" | "20" | "all")}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        <div
          ref={breakdownListRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 custom-scroll space-y-2"
        >
          {visibleBreakdownRows.map((row) => (
            <button
              type="button"
              key={row.name}
              onClick={() => onApplyBreakdownFilter(row)}
              className={`w-full rounded-xl border p-2.5 text-left transition ${
                activeFilterValue === row.name
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="truncate text-xs font-bold text-slate-700">{row.name}</p>
                <span className="text-xs font-bold text-slate-900">{formatCurrency(row.spend)}</span>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{formatPercent(row.sharePercent)} share</span>
                <span className={`text-[10px] font-bold ${row.deltaValue >= 0 ? "text-rose-600" : "text-emerald-700"}`}>
                  {row.deltaValue >= 0 ? "+" : ""}
                  {formatCurrency(row.deltaValue)}
                </span>
              </div>
            </button>
          ))}
          {visibleBreakdownRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-semibold text-slate-500">
              No rows match current search/filter.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default TrendBreakdownSection;
