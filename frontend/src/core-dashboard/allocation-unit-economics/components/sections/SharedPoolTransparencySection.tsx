import React from 'react';
import type { SharedPoolTransparencyRow } from '../../types';
import { formatCurrency } from '../../utils/format';

interface SharedPoolTransparencySectionProps {
  rows: SharedPoolTransparencyRow[];
}

export default function SharedPoolTransparencySection({ rows }: SharedPoolTransparencySectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Shared Cost Pool Transparency</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className={rows.length > 10 ? 'max-h-[420px] overflow-y-auto custom-scrollbar' : ''}>
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3 py-2">Shared Category</th>
                <th className="px-3 py-2 text-right">Cost</th>
                <th className="px-3 py-2">Allocation Rule</th>
                <th className="px-3 py-2">Weight Basis</th>
                <th className="px-3 py-2 text-right">Distributed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length ? (
                rows.map((row) => (
                  <tr key={`${row.sharedCategory}-${row.weightBasis}`}>
                    <td className="px-3 py-2 font-semibold text-slate-800">{row.sharedCategory}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-700">{formatCurrency(row.cost)}</td>
                    <td className="px-3 py-2 text-slate-700">{row.allocationRule}</td>
                    <td className="px-3 py-2 text-slate-700">{row.weightBasis}</td>
                    <td className="px-3 py-2 text-right font-black text-slate-900">{formatCurrency(row.distributedAmount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                    No shared pool categories found for selected scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

