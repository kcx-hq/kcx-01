import React from 'react';
import { DollarSign, Zap, TrendingDown } from 'lucide-react';

const MetricCards = ({ totalSpend, leakageCost, efficiency }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. Total Spend (Blue Glow) */}
      <div className="glass-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <DollarSign size={80} />
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
            <DollarSign size={16} />
          </div>
          <span className="text-gray-400 text-sm font-medium">Total Billed Cost</span>
        </div>
        <div className="text-3xl font-bold text-white mt-1">{formatCurrency(totalSpend)}</div>
        <div className="text-xs text-blue-400 mt-2 flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">LIVE</span>
          <span className="text-gray-500">Data ingested successfully</span>
        </div>
      </div>

      {/* 2. Leakage (Purple Glow - MAIN FOCUS) */}
      <div className="glass-card relative overflow-hidden border-[#a02ff1]/40 shadow-[0_0_30px_rgba(160,47,241,0.1)]">
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#a02ff1]/20 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#a02ff1]/20 flex items-center justify-center text-[#a02ff1]">
            <Zap size={16} />
          </div>
          <span className="text-gray-400 text-sm font-medium">Potential Savings</span>
        </div>
        <div className="text-3xl font-bold text-white mt-1">{formatCurrency(leakageCost)}</div>
        <div className="text-xs text-[#a02ff1] mt-2 font-medium">
          Found in unoptimized resources
        </div>
      </div>

      {/* 3. Efficiency (Green Glow) */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
            <TrendingDown size={16} />
          </div>
          <span className="text-gray-400 text-sm font-medium">Efficiency Score</span>
        </div>
        <div className="flex items-end justify-between mt-1">
          <div className="text-3xl font-bold text-white">{efficiency}%</div>
          <div className="text-xs text-green-400 font-bold mb-1">GOOD</div>
        </div>
        <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div style={{ width: `${efficiency}%` }} className="h-full bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
        </div>
      </div>

    </div>
  );
};

export default MetricCards;