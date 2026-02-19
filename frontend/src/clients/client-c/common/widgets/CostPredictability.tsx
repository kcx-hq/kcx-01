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
  Loader2
} from "lucide-react";

// --- HELPERS ---
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${date.toLocaleString("default", { month: "short" })} ${date.getDate()}`;
};

// --- COMPACT KPI COMPONENT ---
const CompactKPI = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  isActive, 
  onClick, 
  trend 
}) => (
  <button
    onClick={onClick}
    className={`
      relative group flex items-center gap-4 p-3 rounded-xl border transition-all duration-300 w-full text-left
      ${isActive 
        ? `bg-[#1a1b20] border-${color} shadow-[0_0_20px_rgba(0,0,0,0.3)] scale-[1.02]` 
        : "bg-[#0f0f11] border-white/5 hover:bg-[#1a1b20] hover:border-white/10"
      }
    `}
  >
    {isActive && (
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-${color}`} />
    )}
    <div className={`
      p-2.5 rounded-lg shrink-0 transition-colors
      ${isActive ? `bg-${color}/20 text-${color}` : "bg-white/5 text-gray-500 group-hover:text-gray-300"}
    `}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
        {title}
      </p>
      <div className="flex items-baseline gap-2">
        <span className={`text-lg font-black tracking-tight ${isActive ? "text-white" : "text-gray-300"}`}>
          {value || "$0"}
        </span>
        {trend && (
          <span className="text-[10px] font-mono text-gray-500">
            {trend}
          </span>
        )}
      </div>
    </div>
    <div className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}>
       <div className={`w-2 h-2 rounded-full bg-${color} shadow-[0_0_8px_currentColor]`} />
    </div>
  </button>
);

// --- MAIN COMPONENT ---
const CostPredictability = ({ 
  chartData = [], 
  anomalies = [], 
  kpis = {} 
}) => {
  const [activeView, setActiveView] = useState("score");

  const score = kpis.predictabilityScore || 0;
  const scoreColor = score >= 80 ? "emerald-400" : score >= 50 ? "yellow-400" : "red-400";
  const scoreTailwind = score >= 80 ? "emerald-400" : score >= 50 ? "yellow-400" : "red-400";

  // Filter Data Logic
  const viewData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    if (activeView === "forecast") {
      const historyPoints = chartData.filter(d => d.type === 'history');
      const cutoffIndex = Math.max(0, historyPoints.length - 7);
      return chartData.slice(cutoffIndex);
    }
    return chartData;
  }, [chartData, activeView]);

  const todayEntry = chartData?.findLast(d => d.type === 'history');
  const lastHistoryDate = todayEntry?.date;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 w-full">
      
      {/* --- ROW 1: KPIS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <CompactKPI 
          title="Stability Score"
          value={`${score.toFixed(0)}/100`}
          icon={Target}
          color={scoreTailwind}
          isActive={activeView === "score"}
          onClick={() => setActiveView("score")}
        />
        <CompactKPI 
          title="Projected Spend"
          value={formatCurrency(kpis.forecastTotal || 0)}
          trend="Next 30 Days"
          icon={Calendar}
          color="cyan-400"
          isActive={activeView === "forecast"}
          onClick={() => setActiveView("forecast")}
        />
        <CompactKPI 
          title="Volatility"
          value={`±${kpis.trend ? Math.abs(kpis.trend).toFixed(1) : "0.0"}%`}
          trend="Daily Variance"
          icon={Activity}
          color="rose-400"
          isActive={activeView === "variance"}
          onClick={() => setActiveView("variance")}
        />
      </div>

      {/* --- ROW 2: CHART AREA --- */}
      {/* Forced height to ensure graph appears */}
      <div className="h-[450px] bg-[#1a1b20] border border-white/5 rounded-2xl p-4 flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4 z-10 shrink-0">
          <div>
            <h3 className="text-white font-bold flex items-center gap-2">
              {activeView === 'score' && <><Target size={16} className={`text-${scoreTailwind}`} /> Overall Stability Analysis</>}
              {activeView === 'forecast' && <><TrendingUp size={16} className="text-cyan-400" /> AI Spending Projection</>}
              {activeView === 'variance' && <><AlertCircle size={16} className="text-rose-400" /> Anomaly Detection</>}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-lg">
               {activeView === 'score' && "Reviewing historical consistency combined with future AI projections."}
               {activeView === 'forecast' && "Zoomed view of the transition from actuals to predicted costs."}
               {activeView === 'variance' && "Highlighting specific dates where spending deviated significantly from the baseline."}
            </p>
          </div>

          <div className="flex gap-4 text-[10px] font-bold bg-[#0f0f11]/50 p-2 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#a02ff1]"></div>Actual</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-cyan-400"></div>Forecast</div>
            {activeView === 'variance' && (
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Anomaly</div>
            )}
          </div>
        </div>

        {/* The Graph */}
        <div className="flex-1 w-full relative z-0 min-h-0">
          {!chartData || chartData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
               <Loader2 className="animate-spin mb-2" size={24} />
               <p className="text-xs font-bold">Waiting for data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={viewData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a02ff1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a02ff1" stopOpacity={0} />
                  </linearGradient>
                  <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4" rotation={45}>
                     <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#22d3ee" strokeWidth="1" opacity={0.3} />
                  </pattern>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                
                <XAxis 
                  dataKey="date" 
                  stroke="#555" 
                  fontSize={10} 
                  tickFormatter={(str) => formatDate(str)} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#555" 
                  fontSize={10} 
                  tickFormatter={(val) => `$${val}`} 
                  tickLine={false} 
                  axisLine={false} 
                  width={40}
                />
                
                <Tooltip
                  cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0f0f11]/95 backdrop-blur border border-white/10 p-3 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">{formatDate(label)}</p>
                          {data.actual !== null && (
                            <div className="flex justify-between items-center gap-4 mb-1">
                              <span className="text-xs text-gray-300">Actual Spend</span>
                              <span className="text-sm font-bold font-mono text-white">{formatCurrency(data.actual)}</span>
                            </div>
                          )}
                          {data.forecast !== null && (
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-xs text-cyan-400">AI Forecast</span>
                              <span className="text-sm font-bold font-mono text-cyan-400">{formatCurrency(data.forecast)}</span>
                            </div>
                          )}
                          {data.range && (
                             <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-gray-500">
                                Confidence: {formatCurrency(data.range[0])} - {formatCurrency(data.range[1])}
                             </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#a02ff1"
                  strokeWidth={3}
                  fill="url(#purpleGradient)"
                  activeDot={{ r: 6, fill: "#fff", stroke: "#a02ff1" }}
                  animationDuration={1000}
                />
                <Area
                  dataKey="range"
                  stroke="none"
                  fill="url(#hatch)"
                  animationDuration={1000}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  animationDuration={1000}
                />
                {lastHistoryDate && (
                  <ReferenceLine 
                      x={lastHistoryDate} 
                      stroke="#fff" 
                      strokeOpacity={0.2} 
                  />
                )}
                {activeView === 'variance' && anomalies.map((anomaly, idx) => (
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

      {/* --- ROW 3: INSIGHTS STRIP --- */}
      <div className="shrink-0 flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#a02ff1]/10 to-transparent border border-[#a02ff1]/20">
        <div className="p-2 rounded-lg bg-[#a02ff1]/20 text-[#a02ff1]">
            <Zap size={16} />
        </div>
        <div className="flex-1">
            <h4 className="text-xs font-bold text-white">AI Analysis</h4>
            <p className="text-[11px] text-gray-400">
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