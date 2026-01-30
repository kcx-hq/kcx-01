import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const ZombieListView = ({ data, onInspect }) => {
  const zombies = data.filter((i) => i.status === 'Zombie');
  const potentialSavings = zombies.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 border border-orange-500/30 p-6 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-orange-500/20 rounded-full text-orange-400 border border-orange-500/20">
            <Trash2 size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Cleanup Opportunity</h3>
            <p className="text-sm text-gray-400">
              <strong className="text-white">{zombies.length}</strong> resources identified as potential
              zombies (Zero usage, high cost).
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-orange-300 uppercase font-bold tracking-wider mb-1">
            Potential Monthly Savings
          </p>
          <p className="text-4xl font-mono font-black text-orange-400">
            {formatCurrency(potentialSavings)}
          </p>
        </div>
      </div>

      <div className="bg-[#1a1b20] border border-white/10 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#15161a] text-gray-500 font-bold uppercase">
            <tr>
              <th className="px-6 py-4">Resource Identifier</th>
              <th className="px-6 py-4">Detection Logic</th>
              <th className="px-6 py-4 text-right">Cost Impact</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {zombies.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-white truncate max-w-[300px] group-hover:text-orange-400 transition-colors">
                    {item.id}
                  </div>
                  <div className="text-[10px] text-gray-500 flex gap-2 mt-1">
                    <span className="bg-white/5 px-1.5 rounded">{item.service}</span>
                    <span>{item.region}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-orange-500" />
                    <span className="text-gray-300">0% Utilization / Idle</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-white">
                  {formatCurrency(item.totalCost)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onInspect(item)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-colors"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
            {zombies.length === 0 && (
              <tr>
                <td colSpan="4" className="p-10 text-center text-gray-500 italic">
                  No zombie resources detected. Infrastructure is clean.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ZombieListView;
