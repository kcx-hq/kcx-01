import React from "react";
import { ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { formatCurrency } from "../utils/format.js";

const KpiCard = ({ label, value, icon: Icon, iconStyle, subValue, onClick, trend }) => {
  const isIncrease = trend > 0;
  const brandEmerald = "var(--brand-secondary, #007758)";

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden p-4 md:p-5 flex flex-col justify-between group transition-all duration-500 ease-out
        min-h-[104px] md:h-28 rounded-2xl bg-white border border-slate-100
        ${onClick ? "cursor-pointer active:scale-[0.98]" : ""}
        
        /* Fixed Shadow: Use a negative spread (-8px) to pull shadow in at the rounded corners */
        hover:border-emerald-200/60 hover:-translate-y-1
        hover:shadow-[0_15px_30px_-8px_rgba(0,119,88,0.15)]
      `}
    >
      {/* --- NATURE AMBIENT BACKGROUND --- */}
      <div 
        className="absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl opacity-10 transition-all duration-700 group-hover:opacity-20"
        style={{ backgroundColor: brandEmerald }} 
      />
      
      {/* --- HEADER SECTION --- */}
      <div className="z-10 flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-500 transition-colors">
            {label}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-1 group-hover:translate-y-0">
             <Sparkles size={8} className="text-emerald-500" />
             <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter">Live Intel</span>
          </div>
        </div>
        
        <div className={`p-2 rounded-xl border transition-all duration-500 group-hover:shadow-sm ${iconStyle || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
          <Icon size={16} className="md:w-[18px] md:h-[18px]" strokeWidth={2.5} />
        </div>
      </div>

      {/* --- VALUE SECTION --- */}
      <div className="z-10 flex items-end justify-between mb-0.5">
        <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none">
          {typeof value === "number" ? formatCurrency(value) : value}
        </div>

        {trend !== undefined ? (
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black border transition-all duration-300 ${
            isIncrease 
              ? "bg-rose-50 text-rose-500 border-rose-100" 
              : "bg-emerald-50 text-emerald-500 border-emerald-100"
          }`}>
            {isIncrease ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        ) : subValue ? (
          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
            {subValue}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default KpiCard;
