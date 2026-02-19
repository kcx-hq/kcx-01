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
} from "recharts";
import {
  Target,
  Calendar,
  Activity,
  Zap,
  TrendingUp,
  AlertCircle,
  Loader2,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const BRAND_EMERALD = "#007758";

// --- REDESIGNED COMPACT KPI ---
const CompactKPI = ({ title, value, icon: Icon, tone = "brand", isActive, onClick, trend }) => {
  const styles = {
    brand: { bg: "bg-emerald-50", text: "text-[#007758]", border: "border-emerald-100" },
    cyan: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" },
  }[tone];

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all duration-300 w-full text-left shadow-sm
        ${isActive 
          ? `bg-white border-slate-200 ring-4 ring-slate-50` 
          : `bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-md`}`}
    >
      <div className={`p-3 rounded-2xl border transition-transform duration-300 ${styles.bg} ${styles.text} ${styles.border} ${isActive ? 'scale-110 shadow-sm' : ''}`}>
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-black tracking-tight ${isActive ? "text-slate-900" : "text-slate-600"}`}>
            {value || "$0"}
          </span>
          {trend && <span className="text-[10px] font-bold text-slate-400">{trend}</span>}
        </div>
      </div>

      {isActive && (
        <motion.div layoutId="active-dot" className="w-2 h-2 rounded-full bg-[#007758]" />
      )}
    </button>
  );
};

// --- MAIN COMPONENT ---
const CostPredictability = ({ chartData = [], anomalies = [], kpis = {} }) => {
  const [activeView, setActiveView] = useState("score");
  const score = Number(kpis.predictabilityScore || 0);

  const viewData = useMemo(() => {
    if (!chartData?.length) return [];
    if (activeView === "forecast") {
      const historyPoints = chartData.filter((d) => d.type === "history");
      return chartData.slice(Math.max(0, historyPoints.length - 10));
    }
    return chartData;
  }, [chartData, activeView]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full">
      
      {/* --- KPIS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <CompactKPI
          title="Stability Score"
          value={`${score.toFixed(0)}/100`}
          icon={Target}
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

      {/* --- CHART CANVAS --- */}
      <div className="h-[480px] bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col shadow-sm relative overflow-visible transition-all hover:shadow-md">
        
        {/* Dynamic Header */}
        <div className="flex justify-between items-start mb-10 z-10">
          <div>
            <div className="flex items-center gap-3">
               <div className="p-2 bg-emerald-50 rounded-lg">
                  {activeView === "score" && <Target size={18} className="text-[#007758]" />}
                  {activeView === "forecast" && <TrendingUp size={18} className="text-blue-600" />}
                  {activeView === "variance" && <AlertCircle size={18} className="text-rose-600" />}
               </div>
               <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                 {activeView === "score" && "Stability Analysis"}
                 {activeView === "forecast" && "Spending Projection"}
                 {activeView === "variance" && "Anomaly Intelligence"}
               </h3>
            </div>
            <p className="text-xs font-medium text-slate-400 mt-2 ml-11">
              {activeView === "score" && "Reviewing historical consistency combined with future projections."}
              {activeView === "forecast" && "Transition from actual consumption to predicted expenditure."}
              {activeView === "variance" && "Detecting spending deviations from established baseline patterns."}
            </p>
          </div>

          <div className="flex gap-6 px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <div className="w-2 h-2 rounded-full bg-[#007758]" /> Actual
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <div className="w-2 h-2 rounded-full border-2 border-blue-400" /> Forecast
            </div>
          </div>
        </div>

        {/* Recharts Component */}
        <div className="flex-1 w-full relative min-h-0">
          {!chartData?.length ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="p-4 bg-slate-50 rounded-full animate-spin">
                <Loader2 size={24} className="text-slate-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Cloud Intelligence</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={viewData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="brandArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_EMERALD} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={BRAND_EMERALD} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />

                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={10}
                  fontWeight={700}
                  tickFormatter={(str) => formatDate(str)}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  fontWeight={700}
                  tickFormatter={(val) => `$${val}`}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#192630] text-white p-4 rounded-2xl shadow-2xl border border-white/10 min-w-[200px] backdrop-blur-md">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                          {formatDate(label)}
                        </p>
                        <div className="space-y-2">
                          {data.actual !== undefined && (
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-[11px] font-bold text-slate-300">Measured Cost</span>
                              <span className="text-sm font-black text-emerald-400">{formatCurrency(data.actual)}</span>
                            </div>
                          )}
                          {data.forecast !== undefined && (
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-[11px] font-bold text-slate-300">AI Projection</span>
                              <span className="text-sm font-black text-blue-400">{formatCurrency(data.forecast)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke={BRAND_EMERALD}
                  strokeWidth={3.5}
                  fill="url(#brandArea)"
                  animationDuration={1500}
                />

                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  strokeDasharray="8 6"
                  dot={false}
                  animationDuration={1500}
                />

                {activeView === "variance" && anomalies.map((a, idx) => (
                  <ReferenceLine
                    key={idx}
                    x={a.date}
                    stroke="#f43f5e"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{ position: 'top', value: '⚠', fill: '#f43f5e', fontSize: 14 }}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* --- FOOTER INSIGHTS --- */}
      <div className="shrink-0 flex items-center gap-4 p-5 rounded-[1.5rem] bg-emerald-50/50 border border-emerald-100 shadow-sm transition-all hover:bg-emerald-50">
        <div className="p-3 rounded-2xl bg-white border border-emerald-100 shadow-sm text-[#007758]">
          <Sparkles size={18} className="animate-pulse" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">KCX AI Analysis</h4>
          <p className="text-[11px] font-bold text-slate-500 mt-0.5 leading-relaxed">
            {score > 80
              ? "Infrastructure spending remains within predictable thresholds. Cloud unit efficiency is optimized."
              : "Variance detected above baseline thresholds. Recommended to audit the highlighted dates for spike origins."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CostPredictability;