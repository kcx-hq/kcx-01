import React from 'react';
import { MapPin, TrendingUp } from 'lucide-react';

const MostPopularRegion = ({ data, totalSpend, billingPeriod }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
        <div className="text-center py-8">
          <MapPin size={32} className="text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">No region data available</p>
        </div>
      </div>
    );
  }

  // Sort by cost descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  return (
    <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
      <div className="mb-4 flex items-center gap-2">
        <MapPin size={16} className="text-green-400" />
        <h3 className="text-sm font-bold text-white">Regional Cost Breakdown</h3>
        <TrendingUp size={12} className="text-gray-500 ml-auto" />
      </div>

      <div className="space-y-3">
        {sortedData.map((region, index) => {
          const percentage = totalSpend > 0 ? (region.value / totalSpend) * 100 : 0;
          const barWidth = `${Math.min(percentage, 100)}%`;
          
          return (
            <div key={region.name} className="group">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400 w-6">#{index + 1}</span>
                  <span className="text-sm font-medium text-white truncate max-w-[120px] sm:max-w-[180px]">
                    {region.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">
                    {formatCurrency(region.value)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-[#0f0f11] rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: barWidth }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {totalSpend > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Total Spend</span>
            <span className="font-bold text-white">{formatCurrency(totalSpend)}</span>
          </div>
          {billingPeriod && (
            <div className="text-[10px] text-gray-500 mt-1">
              Billing Period: {billingPeriod.start} to {billingPeriod.end}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MostPopularRegion;