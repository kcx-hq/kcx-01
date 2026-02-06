import React, { useState, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import {
  Target,
  Calendar,
  Activity,
  Zap,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";

// --- HELPERS ---
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${date.toLocaleString("default", { month: "short" })} ${date.getDate()}`;
};

// ✅ theme tokens (no gradient / no glow)
const BRAND = "var(--brand-secondary, #007758)";

// ✅ safe class maps (avoid `border-${color}` dynamic Tailwind)
const COLOR_STYLES = {
  brand: {
    ring: "border-white/10",
    activeBorder: "border-white/20",
    dot: "bg-white",
    iconActive: "text-white",
    iconIdle: "text-white/60",
  },
  cyan: {
    ring: "border-white/10",
    activeBorder: "border-white/20",
    dot: "bg-cyan-300",
    iconActive: "text-cyan-200",
    iconIdle: "text-white/60",
  },
  rose: {
    ring: "border-white/10",
    activeBorder: "border-white/20",
    dot: "bg-rose-300",
    iconActive: "text-rose-200",
    iconIdle: "text-white/60",
  },
};

// --- COMPACT KPI COMPONENT ---
const CompactKPI = ({
  title,
  value,
  icon: Icon,
  tone = "brand", // "brand" | "cyan" | "rose"
  isActive,
  onClick,
  trend,
}) => {
  const s = COLOR_STYLES[tone] || COLOR_STYLES.brand;

  return (
    <button
      onClick={onClick}
      className={[
        "relative group flex items-center gap-4 p-3 rounded-xl border transition-colors duration-200 w-full text-left",
        isActive
          ? `bg-[#121214] ${s.activeBorder}`
          : `bg-[#0f0f11] ${s.ring} hover:bg-[#121214] hover:border-white/15`,
      ].join(" ")}
    >
      {/* active left bar */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: BRAND }} />
      )}

      {/* icon pill */}
      <div
        className={[
          "p-2.5 rounded-lg shrink-0 border",
          isActive ? "bg-black/20 border-white/15" : "bg-white/5 border-white/10",
        ].join(" ")}
      >
        <Icon size={20} className={isActive ? s.iconActive : s.iconIdle} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <span className={`text-lg font-black tracking-tight ${isActive ? "text-white" : "text-white/80"}`}>
            {value || "$0"}
          </span>
          {trend && <span className="text-[10px] font-mono text-white/50">{trend}</span>}
        </div>
      </div>

      {/* active dot (no glow) */}
      <div className={`transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`}>
        <div className={`w-2 h-2 rounded-full ${s.dot}`} />
      </div>
    </button>
  );
};

// --- MAIN COMPONENT ---
const CostPredictability = ({ chartData = [], anomalies = [], kpis = {} }) => {
  const [activeView, setActiveView] = useState("score");

  const score = Number(kpis.predictabilityScore || 0);

  // Filter Data Logic
  const viewData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    if (activeView === "forecast") {
      const historyPoints = chartData.filter((d) => d.type === "history");
      const cutoffIndex = Math.max(0, historyPoints.length - 7);
      return chartData.slice(cutoffIndex);
    }
    return chartData;
  }, [chartData, activeView]);

  // safer than findLast (older browsers)
  const lastHistory = useMemo(() => {
    for (let i = (chartData?.length || 0) - 1; i >= 0; i--) {
      if (chartData[i]?.type === "history") return chartData[i];
    }
    return null;
  }, [chartData]);

  const lastHistoryDate = lastHistory?.date;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 w-full">
      {/* --- ROW 1: KPIS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <CompactKPI
          title="Stability Score"
          value={`${score.toFixed(0)}/100`}
          icon={Target}
          tone="brand"
          isActive={activeView === "score"}
          onClick={() => setActiveView("score")}
        />
        <CompactKPI
          title="Projected Spend"
          value={formatCurrency(kpis.forecastTotal || 0)}
          trend="Next 30 Days"
          icon={Calendar}
          tone="cyan"
          isActive={activeView === "forecast"}
          onClick={() => setActiveView("forecast")}
        />
        <CompactKPI
          title="Volatility"
          value={`±${kpis.trend ? Math.abs(kpis.trend).toFixed(1) : "0.0"}%`}
          trend="Daily Variance"
          icon={Activity}
          tone="rose"
          isActive={activeView === "variance"}
          onClick={() => setActiveView("variance")}
        />
      </div>

      {/* --- ROW 2: CHART AREA --- */}
      <div className="h-[450px] bg-[#121214] border border-white/10 rounded-2xl p-4 flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 z-10 shrink-0">
          <div>
            <h3 className="text-white font-bold flex items-center gap-2">
              {activeView === "score" && (
                <>
                  <Target size={16} className="text-white/80" />
                  Overall Stability Analysis
                </>
              )}
              {activeView === "forecast" && (
                <>
                  <TrendingUp size={16} className="text-cyan-200" />
                  AI Spending Projection
                </>
              )}
              {activeView === "variance" && (
                <>
                  <AlertCircle size={16} className="text-rose-200" />
                  Anomaly Detection
                </>
              )}
            </h3>
            <p className="text-xs text-white/50 mt-1 max-w-lg">
              {activeView === "score" &&
                "Reviewing historical consistency combined with future projections."}
              {activeView === "forecast" &&
                "Zoomed view of the transition from actuals to predicted costs."}
              {activeView === "variance" &&
                "Highlighting dates where spending deviated significantly from the baseline."}
            </p>
          </div>

          <div className="flex gap-4 text-[10px] font-bold bg-black/20 p-2 rounded-lg border border-white/10">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAND }} />
              Actual
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full border border-cyan-300" />
              Forecast
            </div>
            {activeView === "variance" && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-300" />
                Anomaly
              </div>
            )}
          </div>
        </div>

        {/* Graph */}
        <div className="flex-1 w-full relative z-0 min-h-0">
          {!chartData || chartData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
              <Loader2 className="animate-spin mb-2" size={24} />
              <p className="text-xs font-bold">Waiting for data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={viewData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {/* Actual area (brand) */}
                  <linearGradient id="brandArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(0,119,88,0.35)" />
                    <stop offset="95%" stopColor="rgba(0,119,88,0)" />
                  </linearGradient>

                  {/* Forecast confidence hatch */}
                  <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4" rotation={45}>
                    <path
                      d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
                      stroke="#22d3ee"
                      strokeWidth="1"
                      opacity={0.25}
                    />
                  </pattern>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />

                <XAxis
                  dataKey="date"
                  stroke="#666"
                  fontSize={10}
                  tickFormatter={(str) => formatDate(str)}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis
                  stroke="#666"
                  fontSize={10}
                  tickFormatter={(val) => `$${val}`}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />

                <Tooltip
                  cursor={{ stroke: "#fff", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.25 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0f0f11]/95 backdrop-blur border border-white/10 p-3 rounded-xl shadow-2xl">
                          <p className="text-[10px] font-bold text-white/60 uppercase mb-2">
                            {formatDate(label)}
                          </p>

                          {data.actual !== null && data.actual !== undefined && (
                            <div className="flex justify-between items-center gap-4 mb-1">
                              <span className="text-xs text-white/80">Actual Spend</span>
                              <span className="text-sm font-bold font-mono text-white">
                                {formatCurrency(data.actual)}
                              </span>
                            </div>
                          )}

                          {data.forecast !== null && data.forecast !== undefined && (
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-xs text-cyan-200">AI Forecast</span>
                              <span className="text-sm font-bold font-mono text-cyan-200">
                                {formatCurrency(data.forecast)}
                              </span>
                            </div>
                          )}

                          {data.range && (
                            <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-white/60">
                              Confidence: {formatCurrency(data.range[0])} - {formatCurrency(data.range[1])}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Actual */}
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke={BRAND}
                  strokeWidth={3}
                  fill="url(#brandArea)"
                  activeDot={{ r: 5, fill: "#fff", stroke: BRAND }}
                  animationDuration={800}
                />

                {/* Confidence band (if you pass `range` as [low, high] per point) */}
                <Area dataKey="range" stroke="none" fill="url(#hatch)" animationDuration={800} />

                {/* Forecast */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  animationDuration={800}
                />

                {lastHistoryDate && <ReferenceLine x={lastHistoryDate} stroke="#fff" strokeOpacity={0.15} />}

                {activeView === "variance" &&
                  anomalies.map((anomaly, idx) => (
                    <ReferenceLine
                      key={idx}
                      x={anomaly.date}
                      stroke="#fb7185"
                      strokeDasharray="2 2"
                      strokeOpacity={0.6}
                    >
                      <ReferenceDot r={4} fill="#fb7185" stroke="none" />
                    </ReferenceLine>
                  ))}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* --- ROW 3: INSIGHTS STRIP (no gradient) --- */}
      <div className="shrink-0 flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/10">
        <div className="p-2 rounded-lg border border-white/10" style={{ backgroundColor: "rgba(0,0,0,0.25)" }}>
          <Zap size={16} className="text-white/80" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-white">AI Analysis</h4>
          <p className="text-[11px] text-white/70">
            {score > 80
              ? "Spending is highly predictable. No major interventions required."
              : "Volatility detected. Check the highlighted Variance dates above to optimize costs."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CostPredictability;
