// frontend/clients/client-d/dashboards/overview/data-explorer/components/StatCard.jsx
import React from "react";
import { Crown } from "lucide-react";
import type { StatCardProps } from "../types";

const StatCard = ({ icon: Icon, label, value, locked }: StatCardProps) => {
  return (
    <div className="relative bg-[#1a1b20]/70 border border-white/10 rounded-xl px-4 py-3 overflow-hidden">
      {locked && (
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <Crown size={16} className="text-yellow-400" />
        </div>
      )}

      <div className={`flex items-center gap-3 ${locked ? "opacity-50" : ""}`}>
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <Icon size={16} className="text-[#23a282]" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold truncate">
            {label}
          </div>
          <div
            className="text-sm font-mono font-bold text-white truncate"
            title={String(value)}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
