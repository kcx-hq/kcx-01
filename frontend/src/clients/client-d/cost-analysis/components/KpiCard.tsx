import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "../utils/format";
import type { KpiCardProps } from "../types";

const KpiCard = ({ label, value, icon: Icon, iconColor, subValue, onClick, trend }: KpiCardProps) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-xl bg-[#1a1b20] border border-white/5 p-4
      transition-all duration-300 ease-out h-28 flex flex-col justify-between group
      ${onClick ? "cursor-pointer hover:border-[#007758]/30 hover:bg-[#1a1b20]/80 hover:shadow-[0_0_20px_rgba(0,119,88,0.15)] hover:scale-[1.02] hover:-translate-y-1" : ""}
    `}
  >
    <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full ${iconColor.replace("text-", "bg-")}/10 blur-xl group-hover:bg-[#007758]/20 transition-all duration-500`} />
    <div className="flex justify-between items-start z-10">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">
        {label}
      </span>
      <div className={`p-1.5 rounded-lg bg-[#0f0f11] ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={16} />
      </div>
    </div>

    <div className="z-10">
      <div className="text-2xl font-black text-white tracking-tight">
        {typeof value === "number" ? formatCurrency(value) : value}
      </div>

      {trend !== undefined ? (
        <div className={`flex items-center gap-1 text-[10px] font-bold ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend).toFixed(1)}% vs prev period
        </div>
      ) : subValue ? (
        <div className="text-[10px] font-medium text-gray-500 flex items-center gap-1">{subValue}</div>
      ) : null}
    </div>
  </div>
);

export default KpiCard;
