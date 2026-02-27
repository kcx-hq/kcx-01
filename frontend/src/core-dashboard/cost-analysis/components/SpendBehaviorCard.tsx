import React, { useCallback, useMemo } from "react";
import { 
  BarChart3, 
  Activity, 
  Crown, 
  TrendingUp, 
  LayoutPanelLeft, 
  LineChart as LineIcon, 
  Sparkles 
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { formatCurrency, formatDate } from "../utils/format";
import type { CostChartType, SpendBehaviorCardProps, TooltipPayloadEntry } from "../types";

// --- SHARED PALETTE (Must be identical in both files) ---
const COLOR_PALETTE = [
  "#007758", // 1. Emerald
  "#84cc16", // 2. Lime
  "#0ea5e9", // 3. Sky Blue
  "#22c55e", // 4. Green
  "#14b8a6", // 5. Teal
  "#f59e0b", // 6. Amber
  "#10b981", // 7. Mint
  "#38bdf8", // 8. Cyan
  "#fb923c", // 9. Orange
  "#64748b", // 10. Slate
];

interface SpendBehaviorTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const SpendBehaviorTooltip = ({ active, payload, label }: SpendBehaviorTooltipProps) => {
  if (active && payload && payload.length) {
    const sortedPayload = [...payload].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

      return (
        <div className="min-w-[220px] animate-in zoom-in-95 rounded-2xl border border-emerald-100 bg-white p-4 text-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl duration-200 z-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {formatDate(label)}
            </span>
            <Sparkles size={10} className="text-emerald-400" />
          </div>
          <div className="space-y-2.5">
            {sortedPayload.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-2 h-2 rounded-full ring-2 ring-white/10 shadow-sm" 
                    style={{ backgroundColor: entry.color }} 
                  />
                  <span className="max-w-[120px] truncate text-[11px] font-bold text-slate-600">
                    {entry.name}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-black text-slate-800">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

const SpendBehaviorCard = ({
  isLocked,
  chartType,
  setChartType,
  chartData,
  activeKeys,
  hiddenSeries,
  isRefreshing = false,
  brandColor = "#007758",
}: SpendBehaviorCardProps) => {
  
  const BRAND_PRIMARY = brandColor || "var(--brand-primary, #007758)";
  const getSeriesColor = useCallback(
    (key: string) => {
      const idx = activeKeys.indexOf(key);
      return COLOR_PALETTE[(idx >= 0 ? idx : 0) % COLOR_PALETTE.length];
    },
    [activeKeys]
  );

  // In stacked areas, last rendered series controls the top boundary stroke.
  // Reverse draw order so primary keys don't look visually overridden.
  const stackedRenderKeys = [...activeKeys].reverse();
  const seriesPointCount = useMemo(() => {
    const counts: Record<string, number> = {};
    activeKeys.forEach((k: string) => {
      counts[k] = (chartData || []).reduce((n: number, row) => {
        const v = Number(row?.[k]) || 0;
        return n + (v > 0 ? 1 : 0);
      }, 0);
    });
    return counts;
  }, [activeKeys, chartData]);
  const seriesTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    activeKeys.forEach((k: string) => {
      totals[k] = (chartData || []).reduce((sum: number, row) => sum + (Number(row?.[k]) || 0), 0);
    });
    return totals;
  }, [activeKeys, chartData]);
  const maxSeriesTotal = useMemo(
    () => Math.max(0, ...Object.values(seriesTotals || {}).map((v: number) => Number(v) || 0)),
    [seriesTotals]
  );

  const handleChartType = useCallback((t: CostChartType) => {
    if (isLocked && (t === "bar" || t === "line")) return;
    setChartType(t);
  }, [isLocked, setChartType]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 p-6 pb-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm group hover:scale-105 transition-transform duration-500">
            <TrendingUp size={20} style={{ color: BRAND_PRIMARY }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg text-slate-900 tracking-tight leading-none">
                Cost Trends
              </h2>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100/50">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[8px] font-black uppercase text-emerald-700 tracking-tighter">Real-time</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">
              Daily Spend & Usage Breakdown
            </p>
          </div>
        </div>

        {/* --- TOGGLE CONTROLS --- */}
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
          {([
            { id: "area", icon: LayoutPanelLeft, label: "Stacked Area" },
            { id: "bar", icon: BarChart3, label: "Comparison" },
            { id: "line", icon: LineIcon, label: "Trend Line" }
          ] as Array<{ id: CostChartType; icon: typeof LayoutPanelLeft; label: string }>).map((t) => {
            const isPremium = isLocked && (t.id === "bar" || t.id === "line");
            const isActive = chartType === t.id;

            return (
              <button
                key={t.id}
                onClick={() => handleChartType(t.id)}
                disabled={isPremium}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-500 relative text-[10px] font-black uppercase tracking-widest whitespace-nowrap
                  ${isPremium ? "opacity-40 cursor-not-allowed grayscale" : "cursor-pointer"} 
                  ${isActive 
                      ? "bg-white text-[#007758] shadow-[0_4px_15px_rgba(0,119,88,0.08)] scale-[1.02] border border-emerald-50" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/60"}`}
              >
                <t.icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                <span className="hidden sm:block">{t.label}</span>
                {isPremium && (
                  <Crown size={10} className="absolute top-0.5 right-0.5 text-amber-500 fill-amber-500 rotate-12" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- CHART CANVAS --- */}
      <div className="flex-1 w-full min-h-[350px] relative px-6 pb-4">
        {isRefreshing && (
          <div className="absolute top-2 right-2 z-20 inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#007758]">
            <Activity size={10} className="animate-pulse" />
            Updating
          </div>
        )}
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <defs>
                  {activeKeys.map((k: string) => {
                    const color = getSeriesColor(k);
                    const gradId = `color-${String(k).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
                    return (
                      <linearGradient key={k} id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#cbd5e1"
                  tickFormatter={(str: string) => (str ? str.slice(5) : "")}
                  fontSize={10}
                  fontWeight={800}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#cbd5e1"
                  fontSize={10}
                  fontWeight={800}
                  tickFormatter={(val: number) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  content={<SpendBehaviorTooltip />}
                  cursor={{ stroke: BRAND_PRIMARY, strokeWidth: 1.5, strokeDasharray: '4 4' }}
                />
                {stackedRenderKeys.map((k: string) => {
                  if (hiddenSeries.has(k)) return null;
                  const color = getSeriesColor(k);
                  const sparse = (seriesPointCount[k] || 0) <= 1;
                  const lowShare =
                    maxSeriesTotal > 0 &&
                    (seriesTotals[k] || 0) > 0 &&
                    (seriesTotals[k] || 0) <= maxSeriesTotal * 0.08;

                  // For sparse or very low-share services, render point/line overlay so they stay visible.
                  if (sparse || lowShare) {
                    return (
                      <Line
                        key={k}
                        type="linear"
                        dataKey={k}
                        stroke={color}
                        strokeWidth={2}
                        connectNulls={false}
                        dot={(props: { cx?: number; cy?: number; payload?: Record<string, unknown> }) => {
                          const v = Number(props?.payload?.[k]) || 0;
                          if (v <= 0 || props?.cx == null || props?.cy == null) return null;
                          return <circle cx={props.cx} cy={props.cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />;
                        }}
                        activeDot={(props: { cx?: number; cy?: number; payload?: Record<string, unknown> }) => {
                          const v = Number(props?.payload?.[k]) || 0;
                          if (v <= 0 || props?.cx == null || props?.cy == null) return null;
                          return <circle cx={props.cx} cy={props.cy} r={7} fill={color} stroke="#fff" strokeWidth={2} />;
                        }}
                        isAnimationActive={true}
                        animationDuration={1200}
                      />
                    );
                  }

                  return (
                    <Area
                      key={k}
                      type="linear"
                      dataKey={k}
                      stackId="1"
                      connectNulls={false}
                      stroke={color}
                      fill={`url(#color-${String(k).replace(/[^a-zA-Z0-9_-]/g, "_")})`}
                      strokeWidth={3}
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={1500}
                      activeDot={{
                        r: 6,
                        strokeWidth: 4,
                        stroke: "#fff",
                        fill: color,
                      }}
                    />
                  );
                })}
              </AreaChart>
            ) : chartType === "bar" ? (
              <BarChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#cbd5e1" 
                  tickFormatter={(str: string) => str?.slice(5)} 
                  fontSize={10} 
                  fontWeight={800} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10} 
                />
                <YAxis 
                  stroke="#cbd5e1" 
                  fontSize={10} 
                  fontWeight={800} 
                  tickFormatter={(val: number) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-10} 
                />
                <Tooltip content={<SpendBehaviorTooltip />} cursor={{ fill: '#f8fafc', radius: 12 }} />
                {activeKeys.map((k: string) => !hiddenSeries.has(k) && (
                  <Bar 
                    key={k} 
                    dataKey={k} 
                    stackId="a" 
                    fill={getSeriesColor(k)} 
                    radius={[4, 4, 0, 0]} 
                    barSize={24}
                    animationDuration={1500}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#cbd5e1" 
                  tickFormatter={(str: string) => str?.slice(5)} 
                  fontSize={10} 
                  fontWeight={800} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10} 
                />
                <YAxis 
                  stroke="#cbd5e1" 
                  fontSize={10} 
                  fontWeight={800} 
                  tickFormatter={(val: number) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-10} 
                />
                <Tooltip content={<SpendBehaviorTooltip />} />
                {activeKeys.map((k: string) => !hiddenSeries.has(k) && (
                  <Line 
                    key={k} 
                    type="monotone" 
                    dataKey={k} 
                    stroke={getSeriesColor(k)} 
                    strokeWidth={3} 
                    connectNulls={true}
                    dot={{ 
                      r: 4, 
                      fill: "#fff", 
                      stroke: getSeriesColor(k), 
                      strokeWidth: 2 
                    }}
                    activeDot={{ 
                      r: 7, 
                      strokeWidth: 0, 
                      fill: getSeriesColor(k) 
                    }}
                    animationDuration={2000}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
            <div className="p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 mb-4">
                <Activity size={32} className="text-slate-300 animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Aggregating Fiscal Stream
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendBehaviorCard;



