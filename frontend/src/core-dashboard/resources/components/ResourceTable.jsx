import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Sparkline from '../components/Sparkline';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/format';

const ResourceTableView = ({
  rows,
  isPremiumMasked,
  onRowClick,
  flaggedResources,
}) => {
  const displayRows = isPremiumMasked ? rows.slice(0, 10) : rows;

  return (
    <table className="w-full text-left text-xs border-collapse">
      <thead className="bg-[#15161a] text-gray-500 font-bold sticky top-0 z-10">
        <tr>
          <th className="px-6 py-3 max-w-[300px]">Resource Identifier</th>
          <th className="px-6 py-3">Type</th>
          <th className="px-6 py-3">Location</th>
          <th className="px-6 py-3">Health Status</th>
          <th className="px-6 py-3 w-32">Trend</th>
          <th className="px-6 py-3 text-center w-24">Flagged</th>
          <th className="px-6 py-3 text-right">Total Cost</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-white/5">
        {displayRows.map((item) => {
          const isFlagged = flaggedResources.has(item.id);
          return (
            <tr
              key={item.id}
              onClick={() => onRowClick(item)}
              className={`hover:bg-white/5 cursor-pointer group transition-colors ${
                isFlagged ? 'bg-orange-500/5 border-l-2 border-orange-500/50' : ''
              }`}
            >
              <td className="px-6 py-3 font-mono text-gray-300 group-hover:text-[#a02ff1] transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate max-w-[300px]" title={item.id}>
                    {item.id}
                  </span>
                  {isFlagged && (
                    <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />
                  )}
                </div>
              </td>
              <td className="px-6 py-3 text-gray-500">{item.service || '—'}</td>
              <td className="px-6 py-3 text-gray-500">{item.region || '—'}</td>
              <td className="px-6 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-6 py-3">
                <Sparkline
                  data={item.trend}
                  color={item.status === 'Spiking' ? '#ef4444' : '#a02ff1'}
                />
              </td>
              <td className="px-6 py-3 text-center">
                {isFlagged ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/30 rounded text-[10px] font-bold text-orange-400">
                    <AlertTriangle size={10} /> Flagged
                  </span>
                ) : (
                  <span className="text-gray-600 text-[10px]">—</span>
                )}
              </td>
              <td className="px-6 py-3 text-right font-bold text-white font-mono">
                {formatCurrency(item.totalCost)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ResourceTableView;
