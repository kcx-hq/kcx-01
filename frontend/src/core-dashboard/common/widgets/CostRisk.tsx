import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ReferenceArea,
} from "recharts";
import {
  ShieldAlert,
  Flame,
  Search,
  TrendingUp,
  LayoutGrid,
  Activity,
  Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

// --- THEME ---
const BRAND_EMERALD = "#007758";

interface RiskPoint {
  name: string;
  x: number;
  y: number;
  severity?: string;
}

interface CostRiskProps {
  riskData?: RiskPoint[];
  totalSpend?: number;
}

interface RiskKPIProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
  subtext: string;
}

interface ScatterTooltipPayload {
  payload: RiskPoint;
}

interface ScatterTooltipProps {
  active?: boolean;
  payload?: ScatterTooltipPayload[];
}

// --- HELPERS ---
const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

// --- KPI CARD (Redesigned for Enterprise theme) ---
const RiskKPI = ({ title, value, icon: Icon, colorClass, subtext }: RiskKPIProps) => (
  <div className="bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden shadow-sm transition-all hover:shadow-md group">
    {/* Subtle Decorative Aura */}
    <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 rounded-full bg-current ${colorClass.split('-')[0] === 'red' ? 'text-rose-500' : colorClass.split('-')[0] === 'orange' ? 'text-amber-500' : 'text-emerald-500'}`} />
    
    <div className="flex justify-between items-start z-10">
      <div className={`p-3 rounded-2xl border ${colorClass} bg-opacity-10 shadow-sm transition-transform group-hover:scale-110`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
         <Sparkles size={10} className="text-slate-300" />
         <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Live Audit</span>
      </div>
    </div>

    <div className="mt-4 relative z-10">
      <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
        {title}
      </h3>
      <div className="text-2xl font-black text-slate-900 mt-1 leading-none tracking-tight">
        {value}
      </div>
      <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{subtext}</div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
const CostRisk = ({ riskData = [] }: CostRiskProps) => {
  // Filter out tiny data points
  const chartData = riskData.filter((d: RiskPoint) => d.x > 0);

  // Calculate Metrics
  const criticalCount = riskData.filter((d: RiskPoint) => d.severity === "critical").length;
  const highVelocityCount = riskData.filter((d: RiskPoint) => d.y > 20).length;
  const unallocatedSpend = riskData.find((d: RiskPoint) => d.name.includes("Unallocated"))?.x || 0;

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in duration-700">
      
      {/* --- ROW 1: RISK METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <RiskKPI
          title="Critical Alerts"
          value={criticalCount}
          subtext="High Cost + High Growth"
          icon={Flame}
          colorClass="bg-rose-50 border-rose-100 text-rose-600"
        />
        <RiskKPI
          title="Velocity Risk"
          value={highVelocityCount}
          subtext="Growth > 20% Period Over Period"
          icon={TrendingUp}
          colorClass="bg-amber-50 border-amber-100 text-amber-600"
        />
        <RiskKPI
          title="Blind Spot Spend"
          value={formatCurrency(unallocatedSpend)}
          subtext="Untagged Resource Leakage"
          icon={Search}
          colorClass="bg-emerald-50 border-emerald-100 text-emerald-600"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[550px] min-h-0">
        {/* --- LEFT: RISK MATRIX CHART --- */}
        <div className="flex-[2] bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col shadow-sm relative overflow-visible transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-8 shrink-0 z-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                    <LayoutGrid size={18} className="text-[#007758]" />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                  Risk Exposure Matrix
                </h3>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-2 ml-11">
                Magnitude (Total Cost) vs. Velocity (Growth Rate Percentage)
              </p>
            </div>
            
            <div className="flex gap-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-rose-500" /> Critical
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Stable
                </div>
            </div>
          </div>

          <div className="flex-1 w-full relative z-0">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  type="number"
                  dataKey="x"
                  stroke="#94a3b8"
                  tickFormatter={(val: number) => `$${val / 1000}k`}
                  fontSize={10}
                  fontWeight={700}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  stroke="#94a3b8"
                  fontSize={10}
                  fontWeight={700}
                  tickFormatter={(val: number) => `${val}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload }: ScatterTooltipProps) => {
                    if (!active || !payload?.length) return null;
                    const first = payload[0];
                    if (!first?.payload) return null;
                    const d = first.payload;
                    return (
                        <div className="bg-[#192630] text-white p-4 rounded-2xl shadow-2xl border border-white/10 min-w-[200px] backdrop-blur-md">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2 truncate">{d.name}</p>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-slate-300">Cost Focus</span>
                                    <span className="text-[11px] font-black text-white">{formatCurrency(d.x)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-slate-300">Growth</span>
                                    <span className={`text-[11px] font-black ${d.y > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{d.y}%</span>
                                </div>
                            </div>
                        </div>
                    );
                  }}
                />

                <ReferenceArea x1={0} y1={20} fill="#fff1f2" fillOpacity={0.4} />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine
                  y={20}
                  stroke="#fda4af"
                  strokeDasharray="8 8"
                  strokeWidth={2}
                  label={{
                    value: "HIGH VELOCITY ZONE",
                    fill: "#f43f5e",
                    fontSize: 9,
                    fontWeight: 900,
                    position: "insideTopRight",
                    offset: 10
                  }}
                />

                <Scatter data={chartData}>
                  {chartData.map((entry: RiskPoint, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.severity === "critical" ? "#f43f5e" : 
                        entry.severity === "high" ? "#f59e0b" : 
                        entry.severity === "medium" ? "#fbbf24" : "#10b981"
                      }
                      className="drop-shadow-lg transition-all duration-300 hover:opacity-100 opacity-80"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- RIGHT: PRIORITY LIST --- */}
        <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col shadow-sm overflow-hidden relative transition-all hover:border-emerald-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-rose-50 rounded-lg">
                <ShieldAlert size={18} className="text-rose-600" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Priority Remediation
            </h3>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
            <div className="p-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <div className="relative mb-6 mx-auto w-16 h-16 flex items-center justify-center">
                <Activity size={48} className="text-slate-200" />
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-emerald-200 rounded-full"
                />
              </div>
              <span className="block text-xs font-black uppercase tracking-[0.2em] text-slate-800 mb-2">
                Predictive Audit
              </span>
              <span className="text-[11px] font-bold text-slate-400 leading-relaxed max-w-[200px] block mx-auto">
                AI-driven remediation paths are being mapped to your infrastructure.
              </span>
              <button className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest opacity-20 cursor-not-allowed">
                 Locked Module
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostRisk;


