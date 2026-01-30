import React from 'react';
import { formatCurrency } from '../utils/format';

export function VarianceBridge({ overallStats }) {
  if (!overallStats?.totalPrev) return null;

  const maxVal = Math.max(overallStats.totalPrev, overallStats.totalCurr) * 1.3;
  const getHeight = (val) => `${Math.max(4, (Math.abs(val) / maxVal) * 100)}%`;

  return (
    <div className="h-40 flex items-end justify-between gap-3 px-4 pb-2 relative select-none bg-[#1a1b20] rounded-xl border border-white/10 p-4 shadow-lg">
      <div className="absolute inset-0 border-b border-white/5 pointer-events-none" />

      <div className="w-1/4 flex flex-col items-center group relative">
        <div style={{ height: getHeight(overallStats.totalPrev) }} className="w-full bg-gray-600 rounded-t-lg opacity-60 hover:opacity-100 transition-opacity relative flex justify-center">
          <span className="absolute -top-7 text-[10px] font-bold text-gray-300 bg-black/80 border border-white/10 px-1.5 py-0.5 rounded">
            {formatCurrency(overallStats.totalPrev)}
          </span>
        </div>
        <span className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wider">Start</span>
      </div>

      <div className="w-1/4 flex flex-col items-center group relative">
        <div style={{ height: getHeight(overallStats.totalIncreases) }} className="w-full bg-red-500/20 border-t border-red-500 rounded-t-lg relative flex justify-center hover:bg-red-500/30 transition-colors">
          <span className="absolute -top-7 text-[10px] font-bold text-red-400 bg-black/80 border border-red-500/30 px-1.5 py-0.5 rounded">
            +{formatCurrency(overallStats.totalIncreases)}
          </span>
        </div>
        <span className="text-[9px] text-red-400 mt-2 font-bold uppercase tracking-wider">Increases</span>
      </div>

      <div className="w-1/4 flex flex-col items-center group relative">
        <div style={{ height: getHeight(overallStats.totalDecreases) }} className="w-full bg-green-500/20 border-t border-green-500 rounded-t-lg relative flex justify-center hover:bg-green-500/30 transition-colors">
          <span className="absolute -top-7 text-[10px] font-bold text-green-400 bg-black/80 border border-green-500/30 px-1.5 py-0.5 rounded">
            {formatCurrency(overallStats.totalDecreases)}
          </span>
        </div>
        <span className="text-[9px] text-green-400 mt-2 font-bold uppercase tracking-wider">Savings</span>
      </div>

      <div className="w-1/4 flex flex-col items-center group relative">
        <div style={{ height: getHeight(overallStats.totalCurr) }} className="w-full bg-[#a02ff1] rounded-t-lg relative flex justify-center hover:brightness-110 transition-all">
          <span className="absolute -top-7 text-[10px] font-bold text-white bg-black/80 border border-[#a02ff1]/50 px-1.5 py-0.5 rounded">
            {formatCurrency(overallStats.totalCurr)}
          </span>
        </div>
        <span className="text-[9px] text-[#a02ff1] mt-2 font-bold uppercase tracking-wider">End</span>
      </div>
    </div>
  );
}
