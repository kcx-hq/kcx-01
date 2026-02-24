import React from 'react';
import type { ShowbackRow } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';

interface ShowbackTableSectionProps {
  rows: ShowbackRow[];
}

export default function ShowbackTableSection({ rows }: ShowbackTableSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Showback / Chargeback Overview</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Environment</th>
                <th className="px-3 py-2 text-right">Direct Cost</th>
                <th className="px-3 py-2 text-right">Shared Allocated</th>
                <th className="px-3 py-2 text-right">Total Cost</th>
                <th className="px-3 py-2 text-right">% of Total</th>
                <th className="px-3 py-2 text-right">Budget</th>
                <th className="px-3 py-2 text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length ? (
                rows.map((row) => (
                  <tr key={`${row.team}-${row.product}-${row.environment}`}>
                    <td className="px-3 py-2 font-semibold text-slate-800">{row.team}</td>
                    <td className="px-3 py-2 text-slate-700">{row.product}</td>
                    <td className="px-3 py-2 text-slate-700">{row.environment}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-700">{formatCurrency(row.directCost)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-700">{formatCurrency(row.sharedAllocatedCost)}</td>
                    <td className="px-3 py-2 text-right font-black text-slate-900">{formatCurrency(row.totalCost)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-600">{formatPercent(row.pctOfTotal)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-500">
                      {row.budget === null ? 'N/A' : formatCurrency(row.budget)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-500">
                      {row.budgetVariance === null ? 'N/A' : formatCurrency(row.budgetVariance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                    No showback rows available for the selected scope.
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
