import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import PremiumOverlay from '../components/PremiumOverlay';

const GroupedListView = ({ groupedData, isPremiumMasked, onRowClick }) => {
  return (
    <div className="flex flex-col relative" style={{ minHeight: '100%' }}>
      {isPremiumMasked && (
        <div
          className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto"
          style={{ minHeight: '10000px' }}
        >
          <div
            className="sticky top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ width: 'fit-content', height: 'fit-content', position: 'sticky', top: '50%' }}
          >
            <PremiumOverlay variant="full" />
          </div>
        </div>
      )}

      {Object.entries(groupedData)
        .sort((a, b) => (b[1].total || 0) - (a[1].total || 0))
        .map(([key, grp]) => (
          <div key={key} className="border-b border-white/5">
            <div className="bg-[#25262b] px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-white/10 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <ChevronRight size={14} className="text-gray-500" />
                <span className="font-bold text-white text-sm">{key}</span>
                <span className="text-[10px] text-gray-500 bg-black/40 px-2 py-0.5 rounded-full">
                  {grp.items.length} items
                </span>
              </div>
              <span className="font-mono font-bold text-white text-xs">
                {formatCurrency(grp.total)}
              </span>
            </div>

            <div className="divide-y divide-white/5 bg-[#1a1b20]">
              {(isPremiumMasked ? grp.items.slice(0, 10) : grp.items).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onRowClick(item)}
                  className="flex justify-between items-center px-10 py-2 text-xs hover:bg-white/5 cursor-pointer"
                >
                  <span
                    className="font-mono text-gray-400 truncate max-w-[400px] hover:text-[#a02ff1]"
                    title={item.id}
                  >
                    {item.id}
                  </span>
                  <span className="font-mono text-white w-20 text-right flex-shrink-0">
                    {formatCurrency(item.totalCost)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default GroupedListView;
