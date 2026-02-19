import React from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';

export function ClientCDriversList({ title, items, type, onSelect, sortBy }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-[#1a1b20] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No {type === 'inc' ? 'increases' : 'decreases'} found</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${Math.abs(value).toFixed(1)}%`;
  };

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'pct') {
      return Math.abs(b.pct) - Math.abs(a.pct);
    }
    return Math.abs(b.diff) - Math.abs(a.diff);
  });

  return (
    <div className="bg-[#1a1b20] border border-white/10 rounded-xl p-4">
      <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
        {type === 'inc' ? (
          <TrendingUp size={14} className="text-red-400" />
        ) : (
          <TrendingDown size={14} className="text-green-400" />
        )}
        {title}
      </h3>
      
      <div className="space-y-3">
        {sortedItems.slice(0, 10).map((item, index) => (
          <div
            key={index}
            onClick={() => onSelect(item, type)}
            className="group p-3 bg-[#0f0f11] border border-white/5 rounded-lg hover:border-[#a02ff1]/30 hover:bg-[#a02ff1]/5 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate group-hover:text-[#a02ff1] transition-colors">
                  {item.name}
                </h4>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {item.description || `${type === 'inc' ? 'Cost increase' : 'Cost savings'} driver`}
                </p>
              </div>
              
              <div className="text-right ml-3 flex-shrink-0">
                <div className={`flex items-center justify-end ${
                  type === 'inc' ? 'text-red-400' : 'text-green-400'
                }`}>
                  {type === 'inc' ? (
                    <TrendingUp size={12} className="mr-1" />
                  ) : (
                    <TrendingDown size={12} className="mr-1" />
                  )}
                  <span className="text-sm font-bold">
                    {formatCurrency(Math.abs(item.diff))}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatPercent(item.pct)}
                </div>
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between">
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    type === 'inc' ? 'bg-red-400' : 'bg-green-400'
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(item.pct) * 2, 100)}%`
                  }}
                ></div>
              </div>
              <ChevronRight size={14} className="text-gray-500 ml-2 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}