import React from 'react';
import { formatCurrency } from '../utils/format';

const KpiCard = ({
  title,
  count,
  cost,
  icon: Icon,
  color,
  isActive,
  onClick,
  label,
}) => (
  <div
    onClick={onClick}
    className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 group overflow-hidden ${
      isActive
        ? `bg-${color}-500/10 border-${color}-500/50 shadow-[0_0_20px_rgba(0,0,0,0.3)]`
        : 'bg-[#1a1b20] border-white/10 hover:bg-[#25262b] hover:border-white/20'
    }`}
  >
    <div className="flex justify-between items-start mb-2 relative z-10">
      <div
        className={`p-2 rounded-lg ${
          isActive
            ? `bg-${color}-500/20 text-${color}-400`
            : 'bg-black/40 text-gray-400 group-hover:text-white'
        }`}
      >
        <Icon size={18} />
      </div>
      <span className={`text-2xl font-black ${isActive ? 'text-white' : 'text-gray-200'}`}>
        {count}
      </span>
    </div>

    <div className="relative z-10">
      <p
        className={`text-xs font-bold uppercase tracking-wider ${
          isActive ? `text-${color}-400` : 'text-gray-500'
        }`}
      >
        {title}
      </p>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-xs font-mono text-gray-300">{formatCurrency(cost)}</span>
        <span className="text-[10px] text-gray-600">{label}</span>
      </div>
    </div>

    {isActive && (
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${color}-500/10 blur-[40px] rounded-full`} />
    )}
  </div>
);

export default KpiCard;
