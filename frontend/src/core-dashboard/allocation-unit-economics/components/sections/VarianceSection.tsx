import React from 'react';
import type { VarianceRow } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';

interface VarianceSectionProps {
  teamRows: VarianceRow[];
  productRows: VarianceRow[];
}

const Table = ({ title, rows }: { title: string; rows: VarianceRow[] }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3">
    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">{title}</p>
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-right">Δ</th>
            <th className="px-3 py-2 text-right">Δ %</th>
            <th className="px-3 py-2 text-right">Contribution</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.name}>
                <td className="px-3 py-2 font-semibold text-slate-800">{row.name}</td>
                <td className={['px-3 py-2 text-right font-black', row.delta >= 0 ? 'text-amber-700' : 'text-emerald-700'].join(' ')}>
                  {row.delta >= 0 ? '+' : ''}
                  {formatCurrency(row.delta)}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-slate-600">{formatPercent(row.deltaPct)}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-700">{formatPercent(row.contributionPct)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-sm font-semibold text-slate-500">
                No variance rows in selected scope.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default function VarianceSection({ teamRows, productRows }: VarianceSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Allocation Variance</h3>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Table title="Team Cost Change" rows={teamRows} />
        <Table title="Product Cost Change (Service Proxy)" rows={productRows} />
      </div>
    </section>
  );
}
