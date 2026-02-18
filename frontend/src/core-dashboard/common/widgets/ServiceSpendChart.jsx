import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, ChevronDown, Activity, Sparkles, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#007758", "#3B82F6", "#0EA5E9", "#6366F1", "#14B8A6", "#8B5CF6", "#F59E0B"];

const ServiceSpendChart = ({
  data = [],
  title,
  limit = 8,
  onLimitChange,
  totalSpend = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const validData = useMemo(() => {
    return Array.isArray(data)
      ? data
          .filter((item) => item && item.name && typeof item.value === "number")
          .sort((a, b) => b.value - a.value) // Ensure highest spend is always on top
          .slice(0, limit)
      : [];
  }, [data, limit]);

  const chartHeight = Math.max(400, validData.length * 52 + 120);

  const handleSelect = (val) => {
    if (onLimitChange) onLimitChange(val);
    setIsOpen(false);
  };

  return (
    <div
      className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm flex flex-col h-full overflow-visible relative transition-all duration-300 hover:shadow-md"
      style={{ minHeight: `${chartHeight}px` }}
    >
      {/* --- HEADER SECTION --- */}
      <div className="flex justify-between items-start mb-10 relative z-[60]">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100/50 shadow-inner">
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">
              {title || "Service Distribution"}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase border border-emerald-100 tracking-wider">
                <Sparkles size={10} /> Smart Insights
              </span>
              <p className="text-slate-400 text-xs font-medium">Cost intensity by resource</p>
            </div>
          </div>
        </div>

        {/* --- RE-ENGINEERED DROPDOWN --- */}
        {onLimitChange && (
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-3 pl-5 pr-4 py-2.5 border rounded-2xl text-xs font-bold transition-all duration-300 shadow-sm
                ${isOpen 
                    ? "bg-white border-emerald-500 text-emerald-700 ring-4 ring-emerald-50 shadow-emerald-100/50" 
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-emerald-200"
                }`}
            >
              Top {limit}
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? "rotate-180 text-emerald-600" : "rotate-0 text-slate-400"}`} 
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <>
                  {/* Invisible Backdrop to close menu */}
                  <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-36 bg-white border border-slate-100 rounded-[1.25rem] shadow-2xl z-[100] overflow-hidden p-1.5 ring-1 ring-slate-200/50"
                  >
                    {[5, 8, 10, 15].map((val) => (
                      <button
                        key={val}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(val);
                        }}
                        className={`w-full px-4 py-3 text-left text-[11px] font-black rounded-xl transition-all duration-200
                          ${limit === val 
                              ? "bg-emerald-50 text-emerald-700" 
                              : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
                          }`}
                      >
                        Top {val} Services
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* --- CHART SECTION --- */}
      <div className="flex-1 w-full min-h-0 relative z-10 px-2">
        {validData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={validData} 
              layout="vertical" 
              margin={{ left: 20, right: 40, top: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" hide domain={[0, 'dataMax + 10']} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={140} 
                fontSize={11} 
                fontWeight={700} 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#475569' }}
                tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 16)}...` : value}
              />
              <Tooltip 
                cursor={{ fill: "rgba(241, 245, 249, 0.6)", radius: 16 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const pct = totalSpend > 0 ? ((data.value / totalSpend) * 100).toFixed(1) : 0;
                    return (
                      <div className="bg-[#192630] text-white p-4 rounded-2xl shadow-2xl border border-white/10 min-w-[180px]">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{data.name}</p>
                        <div className="flex justify-between items-end gap-4">
                           <span className="text-lg font-black">${data.value.toLocaleString()}</span>
                           <span className="text-[10px] font-bold text-emerald-400 pb-1">{pct}% Share</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 10, 10, 0]} 
                barSize={26}
                animationDuration={1800}
                animationEasing="ease-in-out"
              >
                {validData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
            <div className="p-6 bg-slate-50 rounded-full">
              <Inbox size={48} strokeWidth={1} />
            </div>
            <p className="text-sm font-bold text-slate-400">No comparative data found</p>
          </div>
        )}
      </div>

      {/* --- FOOTER SECTION --- */}
      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Burden</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Growth Nodes</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50/50 rounded-full border border-emerald-100/50">
           <Activity size={12} className="text-emerald-500" />
           <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">
             Live Analysis: {validData.length} Vectors
           </span>
        </div>
      </div>
    </div>
  );
};

export default ServiceSpendChart;