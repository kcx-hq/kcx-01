import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import type { SpendAnalyticsFilters, SpendAnalyticsPayload } from "../../types";
import { formatDate, formatCurrency } from "../../utils/format";
import { buildSeriesColorMap } from "../../utils/seriesColors";
import { formatControlLabel, formatSignedPercent } from "../../utils/view.helpers";
import TrendTooltip from "../shared/TrendTooltip";

interface SpendTrendSectionProps {
  trend: SpendAnalyticsPayload["trend"];
  trust: SpendAnalyticsPayload["trust"];
  filters: SpendAnalyticsFilters;
}

const formatAxisCurrency = (value: number): string => {
  const n = Number(value || 0);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
};

const SpendTrendSection = ({ trend, trust, filters }: SpendTrendSectionProps) => {
  const navigate = useNavigate();
  const allSeries = useMemo(
    () => trend.activeKeys.filter((key) => key && key !== "Other"),
    [trend.activeKeys]
  );
  const seriesColorMap = useMemo(() => buildSeriesColorMap(allSeries), [allSeries]);

  const chartRows = useMemo(
    () =>
      (Array.isArray(trend.series) ? trend.series : []).map((row, index) => ({
        ...row,
        idx: index + 1,
        dateLabel: formatDate(String(row.date || "")),
      })),
    [trend.series]
  );
  const [brushWindow, setBrushWindow] = useState<{ start: number; end: number }>({
    start: 0,
    end: Math.max(0, chartRows.length - 1),
  });
  const anomalyIndexes = useMemo(
    () =>
      chartRows
        .map((row, index) => (Boolean(row.isAnomaly) ? index : -1))
        .filter((index) => index >= 0),
    [chartRows]
  );

  useEffect(() => {
    setBrushWindow({
      start: 0,
      end: Math.max(0, chartRows.length - 1),
    });
  }, [chartRows.length]);

  const focusAnomalies = (): void => {
    if (!anomalyIndexes.length) return;
    const start = Math.max(0, anomalyIndexes[0] - 3);
    const end = Math.min(Math.max(0, chartRows.length - 1), anomalyIndexes[anomalyIndexes.length - 1] + 3);
    setBrushWindow({ start, end });
  };
  const focusPeakDay = (): void => {
    if (!chartRows.length) return;
    const peak = chartRows.reduce(
      (acc, row, index) => {
        const total = Number(row.total || 0);
        return total > acc.value ? { value: total, index } : acc;
      },
      { value: Number.NEGATIVE_INFINITY, index: -1 }
    );
    if (peak.index < 0) return;
    const start = Math.max(0, peak.index - 3);
    const end = Math.min(Math.max(0, chartRows.length - 1), peak.index + 3);
    setBrushWindow({ start, end });
  };

  const selectedScope = useMemo(() => {
    const candidates: Array<{ label: string; value: string }> = [
      { label: "Service", value: filters.service },
      { label: "Team", value: filters.team },
      { label: "App", value: filters.app },
      { label: "Environment", value: filters.env },
      { label: "Provider", value: filters.provider },
      { label: "Account", value: filters.account },
      { label: "Region", value: filters.region },
      { label: "Cost Category", value: filters.costCategory },
      { label: "Sub Account", value: filters.subAccount },
    ];
    return candidates.find((item) => item.value && item.value !== "All") || null;
  }, [
    filters.service,
    filters.team,
    filters.app,
    filters.env,
    filters.provider,
    filters.account,
    filters.region,
    filters.costCategory,
    filters.subAccount,
  ]);

  const summary = useMemo(() => {
    const rows = Array.isArray(trend.series) ? trend.series : [];
    if (!rows.length) {
      return {
        periodLabel: "No period",
        currentTotal: 0,
        previousTotal: 0,
        deltaValue: 0,
        deltaPercent: 0,
        peakDate: null as string | null,
        peakValue: 0,
        anomalyDays: 0,
        anomalyImpact: 0,
      };
    }

    const currentTotal = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);
    const previousTotal = rows.reduce((sum, row) => sum + Number(row.previousTotal || 0), 0);
    const deltaValue = currentTotal - previousTotal;
    const deltaPercent = previousTotal > 0 ? (deltaValue / previousTotal) * 100 : 0;
    const peak = rows.reduce(
      (acc, row) => (Number(row.total || 0) > acc.value ? { value: Number(row.total || 0), date: String(row.date || "") } : acc),
      { value: 0, date: "" }
    );
    const anomalyRows = rows.filter((row) => Boolean(row.isAnomaly));
    const anomalyImpact = anomalyRows.reduce((sum, row) => sum + Number(row.anomalyImpact || 0), 0);
    const firstDate = String(rows[0]?.date || "");
    const lastDate = String(rows[Math.max(0, rows.length - 1)]?.date || "");

    return {
      periodLabel: `${formatDate(firstDate)} - ${formatDate(lastDate)}`,
      currentTotal,
      previousTotal,
      deltaValue,
      deltaPercent,
      peakDate: peak.date || null,
      peakValue: peak.value,
      anomalyDays: anomalyRows.length,
      anomalyImpact,
    };
  }, [trend.series]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-700" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Primary Spend Trend</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
            {formatControlLabel(String(trend.granularity))}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Trust: {trust.confidence}
          </span>
          <button
            type="button"
            onClick={focusAnomalies}
            disabled={!anomalyIndexes.length}
            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
              anomalyIndexes.length
                ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "cursor-not-allowed bg-slate-100 text-slate-400"
            }`}
          >
            Focus anomalies
          </button>
          <button
            type="button"
            onClick={() =>
              setBrushWindow({
                start: 0,
                end: Math.max(0, chartRows.length - 1),
              })
            }
            className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-200"
          >
            Reset focus
          </button>
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-600">
        <span className="font-bold text-slate-700">Period:</span> {summary.periodLabel} | Solid line = current spend, dashed line = {trend.compareLabel.toLowerCase()}, red dots = anomaly days.
        {selectedScope ? (
          <span>
            {" "} | Selected {selectedScope.label.toLowerCase()}: <span className="font-bold text-slate-700">{selectedScope.value}</span>
          </span>
        ) : null}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() =>
            setBrushWindow({
              start: 0,
              end: Math.max(0, chartRows.length - 1),
            })
          }
          className="rounded-xl border border-slate-100 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/30"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current period</p>
          <p className="mt-1 text-sm font-black text-slate-900">{formatCurrency(summary.currentTotal)}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Reset focus</p>
        </button>
        <button
          type="button"
          onClick={() =>
            setBrushWindow({
              start: 0,
              end: Math.max(0, chartRows.length - 1),
            })
          }
          className="rounded-xl border border-slate-100 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/30"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{trend.compareLabel}</p>
          <p className="mt-1 text-sm font-black text-slate-900">{formatCurrency(summary.previousTotal)}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Reset focus</p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard/cost-drivers")}
          className="rounded-xl border border-slate-100 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/30"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Change</p>
          <p className={`mt-1 text-sm font-black ${summary.deltaValue >= 0 ? "text-rose-700" : "text-emerald-700"}`}>
            {formatSignedPercent(summary.deltaPercent)}
          </p>
          <p className="text-[11px] text-slate-600">{summary.deltaValue >= 0 ? "+" : ""}{formatCurrency(summary.deltaValue)}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Open drivers</p>
        </button>
        <button
          type="button"
          onClick={focusPeakDay}
          disabled={!summary.peakDate}
          className={`rounded-xl border bg-white p-3 text-left transition ${
            summary.peakDate
              ? "border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30"
              : "cursor-not-allowed border-slate-100 opacity-70"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Peak day</p>
          <p className="mt-1 text-sm font-black text-slate-900">{formatCurrency(summary.peakValue)}</p>
          <p className="text-[11px] text-slate-600">{summary.peakDate ? formatDate(summary.peakDate) : "N/A"}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Focus peak window</p>
        </button>
        <button
          type="button"
          onClick={focusAnomalies}
          disabled={!anomalyIndexes.length}
          className={`rounded-xl border bg-white p-3 text-left transition ${
            anomalyIndexes.length
              ? "border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30"
              : "cursor-not-allowed border-slate-100 opacity-70"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Anomaly days</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-black text-slate-900">
            <AlertTriangle size={12} className="text-rose-600" />
            {summary.anomalyDays}
          </p>
          <p className="text-[11px] text-slate-600">Impact {formatCurrency(summary.anomalyImpact)}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Focus anomalies</p>
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          Total
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          <span className="h-2 w-3 rounded-sm border-t-2 border-dashed border-slate-600" />
          {trend.compareLabel}
        </span>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartRows} margin={{ top: 16, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="idx"
              type="number"
              domain={["dataMin", "dataMax"]}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(value) => {
                const row = chartRows.find((item) => Number(item.idx) === Number(value));
                return row?.dateLabel || "";
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(value) => formatAxisCurrency(Number(value))}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TrendTooltip />} />
            {allSeries.map((seriesKey) => (
              <Area
                key={seriesKey}
                type="monotone"
                dataKey={seriesKey}
                name={seriesKey}
                stackId="spend"
                stroke={seriesColorMap[seriesKey] || "#94a3b8"}
                fill={seriesColorMap[seriesKey] || "#94a3b8"}
                fillOpacity={0.18}
                strokeWidth={1.2}
              />
            ))}

            <Area
              type="monotone"
              dataKey="total"
              name="Current spend"
              stroke="#047857"
              fill="#10b981"
              fillOpacity={0.16}
              strokeWidth={1.8}
            />

            <Line type="monotone" dataKey="total" name="Total" stroke="#0f172a" strokeWidth={2.5} dot={false} />
            <Line
              type="monotone"
              dataKey="previousTotal"
              name={trend.compareLabel}
              stroke="#334155"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />

            {chartRows
              .filter((row) => Boolean(row.isAnomaly))
              .map((row) => (
                <ReferenceDot
                  key={`anomaly-dot-${row.date}`}
                  x={row.idx}
                  y={Number(row.total || 0)}
                  r={4}
                  fill="#ef4444"
                  stroke="#881337"
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
    </section>
  );
};

export default SpendTrendSection;
