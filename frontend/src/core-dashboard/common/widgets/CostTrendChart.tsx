import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, ChevronDown, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BRAND_COLOR = "#007758";
const TOOLTIP_BG = "#192630"; // Matches vertical navbar / service chart tooltip

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 rounded-2xl shadow-2xl border border-white/10 min-w-[180px] animate-in fade-in zoom-in-95 duration-200"
           style={{ backgroundColor: TOOLTIP_BG }}>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
          {label}
        </p>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Daily Spend</span>
          <div className="flex justify-between items-end gap-4">
             <span className="text-lg font-black text-white">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(payload[0].value)}
             </span>
             <span className="text-[10px] font-bold text-emerald-400 pb-1">Live</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CostTrendChart = ({
  data,
  limit = 30,
  onLimitChange,
  avgDailySpend = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const allDataLength = data?.length || 0;
  const effectiveLimit = Math.min(limit, allDataLength);
  const displayData = data?.slice(-effectiveLimit) || [];

  const handleSelect = (val) => {
    if (onLimitChange) onLimitChange(val);
    setIsOpen(false);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm h-full flex flex-col relative overflow-visible transition-all duration-300 hover:shadow-md">
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-10 relative z-[60]">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-emerald-50 rounded-2xl text-[#007758] border border-emerald-100/50 shadow-inner">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">
              Cost Trend
            </h3>
            <div className="flex items-center gap-2 mt-2">
               <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase border border-emerald-100 tracking-wider">
                  <Activity size={10} /> Live Variance
               </span>
               <p className="text-slate-400 text-xs font-medium">Daily spend analysis over time</p>
            </div>
          </div>
        </div>

        {onLimitChange && (
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              onBlur={() => setTimeout(() => setIsOpen(false), 150)}
              className={`flex items-center gap-3 pl-5 pr-4 py-2.5 border rounded-2xl text-xs font-bold transition-all duration-300 shadow-sm
                ${isOpen 
                    ? "bg-white border-emerald-500 text-emerald-700 ring-4 ring-emerald-50 shadow-emerald-100/50" 
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-emerald-200"
                }`}
            >
              {effectiveLimit === allDataLength ? "All Time" : `Last ${effectiveLimit} Days`}
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-500 ${isOpen ? "rotate-180 text-emerald-600" : "rotate-0 text-slate-400"}`} 
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-40 bg-white border border-slate-100 rounded-[1.25rem] shadow-2xl z-[100] overflow-hidden p-1.5 ring-1 ring-slate-200/50"
                >
                  {[7, 15, 30].map((val) => (
                    allDataLength >= val && (
                      <button
                        key={val}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(val);
                        }}
                        className={`w-full px-4 py-3 text-left text-[11px] font-black rounded-xl transition-all duration-200
                          ${effectiveLimit === val 
                              ? "bg-emerald-50 text-emerald-700" 
                              : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
                          }`}
                      >
                        Last {val} Days
                      </button>
                    )
                  ))}
                  
                  {allDataLength > 30 && (
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(allDataLength);
                      }}
                      className="w-full px-4 py-3 text-left text-[11px] font-black rounded-xl text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
                    >
                      All Time
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-[350px] relative z-10 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BRAND_COLOR} stopOpacity={0.2} />
                <stop offset="95%" stopColor={BRAND_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={10}
              fontWeight={700}
              tickFormatter={(str) => {
                  const date = new Date(str);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
            />

            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              fontWeight={700}
              tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />

            <Tooltip 
               content={<CustomTooltip />} 
               cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} 
            />

            {avgDailySpend > 0 && (
                <ReferenceLine
                  y={avgDailySpend}
                  stroke="#fbbf24"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                />
            )}

            <Area
              type="monotoneX"
              dataKey="cost"
              stroke={BRAND_COLOR}
              strokeWidth={3.5}
              fill="url(#colorCost)"
              animationDuration={2000}
              activeDot={{ r: 6, strokeWidth: 0, fill: BRAND_COLOR, className: 'shadow-xl shadow-emerald-200' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend / Footer */}
      <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-slate-50">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#007758] shadow-sm shadow-emerald-200"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.12em]">Actual Spend</span>
         </div>
         {avgDailySpend > 0 && (
             <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 border-t-2 border-dashed border-amber-400"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.12em]">Daily Average (${avgDailySpend.toFixed(0)})</span>
             </div>
         )}
      </div>
    </div>
  );
};

export default CostTrendChart;