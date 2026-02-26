import React from 'react';
import type { EnvironmentUnitRow, TeamProductUnitRow } from '../../types';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/format';

interface UnitBenchmarkSectionProps {
  teamProductRows: TeamProductUnitRow[];
  environmentRows: EnvironmentUnitRow[];
}

export default function UnitBenchmarkSection({
  teamProductRows,
  environmentRows,
}: UnitBenchmarkSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Unit Cost Benchmarks</h3>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
            Unit Cost by Team / Product
          </p>
          <div className={teamProductRows.length > 8 ? 'max-h-[360px] overflow-y-auto custom-scrollbar' : ''}>
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Volume</th>
                  <th className="px-3 py-2 text-right">Final Cost</th>
                  <th className="px-3 py-2 text-right">Unit Cost</th>
                  <th className="px-3 py-2 text-right">Delta %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamProductRows.length ? (
                  teamProductRows.map((row) => (
                    <tr key={`${row.team}-${row.product}`}>
                      <td className="px-3 py-2 font-semibold text-slate-800">{row.team}</td>
                      <td className="px-3 py-2 text-slate-700">{row.product}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatNumber(row.volume)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">{formatCurrency(row.finalCost)}</td>
                      <td className="px-3 py-2 text-right font-black text-slate-900">{formatNumber(row.unitCost, 6)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-600">{formatPercent(row.deltaPct)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No team/product unit rows available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
            Unit Cost by Environment
          </p>
          <div className={environmentRows.length > 8 ? 'max-h-[360px] overflow-y-auto custom-scrollbar' : ''}>
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2">Environment</th>
                  <th className="px-3 py-2 text-right">Volume</th>
                  <th className="px-3 py-2 text-right">Final Cost</th>
                  <th className="px-3 py-2 text-right">Unit Cost</th>
                  <th className="px-3 py-2 text-right">Delta %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {environmentRows.length ? (
                  environmentRows.map((row) => (
                    <tr key={row.environment}>
                      <td className="px-3 py-2 font-semibold text-slate-800">{row.environment}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatNumber(row.volume)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">{formatCurrency(row.finalCost)}</td>
                      <td className="px-3 py-2 text-right font-black text-slate-900">{formatNumber(row.unitCost, 6)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-600">{formatPercent(row.deltaPct)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No environment unit rows available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

