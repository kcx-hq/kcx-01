import React from 'react';
import type { HeatmapCell } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';

interface OwnershipHeatmapSectionProps {
  cells: HeatmapCell[];
}

const tone = {
  1: 'bg-emerald-50',
  2: 'bg-emerald-100',
  3: 'bg-amber-100',
  4: 'bg-amber-200',
  5: 'bg-rose-200',
};

export default function OwnershipHeatmapSection({ cells }: OwnershipHeatmapSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Ownership Heatmap</h3>
      <p className="mb-3 text-xs font-semibold text-slate-600">
        Team x Environment x Spend intensity (current backend snapshot exposes aggregated environment in this scope).
      </p>

      <div className="grid grid-cols-1 gap-2">
        {cells.length ? (
          cells.map((cell) => (
            <article key={`${cell.team}-${cell.environment}`} className={`rounded-lg border border-slate-200 p-3 ${tone[cell.intensityBand]}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-900">
                  {cell.team} | {cell.environment}
                </p>
                <p className="text-sm font-black text-slate-900">{formatCurrency(cell.spend)}</p>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-700">{formatPercent(cell.pctOfTotal)} of total spend</p>
              {cell.riskFlags.length ? (
                <p className="mt-1 text-[11px] font-black uppercase tracking-wider text-rose-700">
                  Risk: {cell.riskFlags.join(', ')}
                </p>
              ) : (
                <p className="mt-1 text-[11px] font-semibold text-emerald-700">No high-risk ownership flags</p>
              )}
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm font-semibold text-slate-500">
            No heatmap cells available for selected scope.
          </div>
        )}
      </div>
    </section>
  );
}
