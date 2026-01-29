import React, { useState } from "react";
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
  ReferenceArea
} from "recharts";
import {
  ShieldAlert,
  Flame,
  Search,
  AlertTriangle,
  TrendingUp,
  LayoutGrid
} from "lucide-react";

// --- HELPERS ---
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

// --- KPI CARD ---
const RiskKPI = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-[#1a1b20] border border-white/5 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden group">
    <div className={`absolute right-0 top-0 p-4 opacity-5 text-${color} transition-transform group-hover:scale-110`}>
      <Icon size={64} />
    </div>
    <div className={`p-3 rounded-lg bg-${color}/10 text-${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</h3>
      <div className="text-xl font-black text-white mt-1">{value}</div>
      <div className="text-[10px] text-gray-400 mt-1">{subtext}</div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
const CostRisk = ({ riskData = [], totalSpend = 0 }) => {
  const [hoveredNode, setHoveredNode] = useState(null);

  // Filter out tiny data points to keep chart clean
  const chartData = riskData.filter(d => d.x > 0);
  
  // Calculate Metrics
  const criticalCount = riskData.filter(d => d.severity === 'critical').length;
  const highVelocityCount = riskData.filter(d => d.y > 20).length; // >20% growth
  const unallocatedItem = riskData.find(d => d.name.includes("Unallocated"));
  const unallocatedSpend = unallocatedItem ? unallocatedItem.x : 0;

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f0f11]/95 backdrop-blur border border-white/10 p-3 rounded-xl shadow-2xl z-50 min-w-[180px]">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
            <span className="font-bold text-xs text-white max-w-[120px] truncate">{data.name}</span>
            {data.severity === 'critical' && <Flame size={12} className="text-red-500 animate-pulse" />}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total Cost:</span>
              <span className="font-mono font-bold text-white">{formatCurrency(data.x)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Growth Rate:</span>
              <span className={`font-mono font-bold ${data.y > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {data.y > 0 ? '+' : ''}{data.y}%
              </span>
            </div>
            <div className="flex justify-between text-xs pt-1 mt-1 border-t border-white/5">
               <span className="text-gray-500">Status:</span>
               <span className={`font-bold text-[10px] uppercase ${
                   data.severity === 'critical' ? 'text-red-500' : 
                   data.severity === 'high' ? 'text-orange-400' : 'text-emerald-500'
               }`}>{data.status}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4 h-full animate-in fade-in duration-500">
      
      {/* --- ROW 1: RISK METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <RiskKPI 
          title="Critical Alerts"
          value={criticalCount}
          subtext="Services with High Cost + High Growth"
          icon={Flame}
          color="red-500"
        />
        <RiskKPI 
          title="Velocity Risk"
          value={highVelocityCount}
          subtext="Services growing > 20% this period"
          icon={TrendingUp}
          color="orange-400"
        />
        <RiskKPI 
          title="Blind Spot Spend"
          value={formatCurrency(unallocatedSpend)}
          subtext="Unallocated or Untagged resources"
          icon={Search}
          color="purple-400"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-[500px] min-h-0">
        
        {/* --- LEFT: RISK MATRIX CHART --- */}
        <div className="flex-[2] bg-[#1a1b20] border border-white/5 rounded-2xl p-4 flex flex-col shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 shrink-0 z-10">
                <div>
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <LayoutGrid size={16} className="text-[#a02ff1]" /> Risk Matrix
                    </h3>
                    <p className="text-xs text-gray-500">
                        X-Axis: Cost Magnitude | Y-Axis: Growth Velocity (%)
                    </p>
                </div>
            </div>

            <div className="flex-1 w-full relative z-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                        <XAxis 
                            type="number" 
                            dataKey="x" 
                            name="Cost" 
                            tickFormatter={(val) => `$${val/1000}k`} 
                            stroke="#555" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis 
                            type="number" 
                            dataKey="y" 
                            name="Growth" 
                            unit="%" 
                            stroke="#555" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        
                        {/* Background Zones */}
                        <ReferenceArea x1={0} y1={20} fill="red" fillOpacity={0.05} stroke="none" />
                        <ReferenceLine y={0} stroke="#666" />
                        <ReferenceLine y={20} stroke="#fb7185" strokeDasharray="3 3" label={{ value: 'High Velocity Threshold', fill: '#fb7185', fontSize: 10, position: 'insideTopRight' }} />

                        <Scatter name="Services" data={chartData} onClick={(p) => setHoveredNode(p)}>
                            {chartData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={
                                        entry.severity === 'critical' ? '#ef4444' : // Red
                                        entry.severity === 'high' ? '#f97316' :     // Orange
                                        entry.severity === 'medium' ? '#eab308' :   // Yellow
                                        '#10b981'                                   // Green
                                    }
                                    fillOpacity={0.7}
                                    stroke="white"
                                    strokeWidth={1}
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* --- RIGHT: PRIORITY LIST --- */}
        <div className="flex-1 bg-[#1a1b20] border border-white/10 rounded-2xl p-4 flex flex-col shadow-xl overflow-hidden relative">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4 shrink-0">
                <ShieldAlert size={16} className="text-red-400" /> Priority Fixes
            </h3>
            
            {/* Coming Soon Overlay */}
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 relative z-10">
                <div className="flex flex-col items-center gap-3">
                    <ShieldAlert size={48} className="opacity-20" />
                    <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Coming Soon</span>
                    <span className="text-xs text-gray-600 text-center max-w-[200px]">
                        Priority fixes feature will be available in a future update
                    </span>
                </div>
            </div>
            
            {/* Masked Content (hidden but preserved for future) */}
            <div className="hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {riskData.filter(d => d.severity !== 'low').length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <ShieldAlert size={32} className="opacity-20 mb-2" />
                            <span className="text-xs">System Healthy. No risks detected.</span>
                        </div>
                    ) : (
                        riskData
                        .filter(d => d.severity !== 'low') // Show Critical, High, Medium
                        .map((item, idx) => (
                            <div key={idx} className="group p-3 rounded-lg bg-[#0f0f11] border border-white/5 hover:border-white/20 transition-all">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-gray-200 truncate max-w-[120px]" title={item.name}>
                                        {item.name}
                                    </span>
                                    {item.severity === 'critical' && (
                                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] font-bold uppercase border border-red-500/20">
                                            Critical
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
                                    <div className="flex flex-col">
                                        <span>Cost Impact</span>
                                        <span className="text-white font-mono">{formatCurrency(item.x)}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span>Velocity</span>
                                        <span className={`font-mono font-bold ${item.y > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {item.y > 0 ? '+' : ''}{item.y}%
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Action Hint */}
                                <div className="h-0 group-hover:h-6 overflow-hidden transition-all duration-300">
                                    <button className="mt-2 w-full py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] text-gray-300 font-bold">
                                        Investigate Root Cause
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CostRisk;