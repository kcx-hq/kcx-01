import React, { memo, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Crown, Filter } from 'lucide-react';
import { useAuthStore } from '../../../store/Authstore';
import { formatCurrency } from '../utils/format';

export const DriversList = memo(function DriversList({
  title,
  items,
  type,
  onSelect,
  sortBy,
}) {
  const { user } = useAuthStore();
  const isMasked = !user?.is_premium; // NOT premium => masked

  const sortedItems = useMemo(() => {
    if (!items?.length) return [];
    return [...items].sort((a, b) => {
      if (sortBy === 'pct') return Math.abs(b.pct) - Math.abs(a.pct);
      return Math.abs(b.diff) - Math.abs(a.diff);
    });
  }, [items, sortBy]);

  const visibleItems = useMemo(() => (isMasked ? sortedItems.slice(0, 5) : sortedItems), [sortedItems, isMasked]);
  const hasMoreItems = isMasked && sortedItems.length > 10;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${type === 'inc' ? 'bg-red-500' : 'bg-green-500'}`} />
          {title} <span className="text-gray-600">({items?.length || 0})</span>
        </h3>
      </div>

      <div className="bg-[#1a1b20] border border-white/10 rounded-xl overflow-hidden h-[600px] flex flex-col relative">
        {visibleItems.length ? (
          <div className="divide-y divide-white/5 overflow-y-auto h-full scrollbar-thin relative">
            {visibleItems.map((item, index) => (
              <div
                key={`${type}-${item.name || item.id || index}-${index}`}
                onClick={() => onSelect(item, type)}
                className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-md ${type === 'inc' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    {type === 'inc' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate max-w-[150px] group-hover:text-[#a02ff1] transition-colors">
                        {item.name}
                      </h4>
                      {item.isNew && (
                        <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded font-bold border border-blue-500/30">
                          NEW
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                        <span>{formatCurrency(item.prev)}</span>
                        <span>➜</span>
                        <span className="text-gray-400">{formatCurrency(item.curr)}</span>
                      </div>
                      {item.contribution && Math.abs(item.contribution) > 5 && (
                        <span className="text-[8px] bg-white/5 border border-white/10 px-1 rounded text-gray-300 font-medium">
                          Impact: {item.contribution}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right whitespace-nowrap pl-2">
                  <div className={`text-xs font-mono font-bold ${type === 'inc' ? 'text-red-400' : 'text-green-400'}`}>
                    {type === 'inc' ? '+' : ''}
                    {formatCurrency(item.diff)}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5">
                    {!item.pct || item.pct === Infinity || item.pct > 999 ? '>999%' : `${Math.abs(item.pct).toFixed(1)}%`}
                  </div>
                </div>
              </div>
            ))}

            {hasMoreItems && (
              <div className="relative" style={{ minHeight: '400px' }}>
                <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500/30 mb-4">
                      <Crown size={32} className="text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Premium Feature</h3>
                    <p className="text-sm text-gray-400 mb-4 max-w-xs">This feature is available in our paid version</p>
                    <button className="px-6 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto">
                      <Filter size={16} />
                      Upgrade to Access
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 h-full text-gray-500">
            <p className="text-xs">No drivers found.</p>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1a1b20] to-transparent pointer-events-none" />
      </div>
    </div>
  );
});
