import React from 'react';
import type { CoverageModel } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';

interface CoverageKpisSectionProps {
  coverage: CoverageModel;
}

const stateClass = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-rose-200 bg-rose-50 text-rose-700',
  na: 'border-slate-200 bg-slate-50 text-slate-600',
};

export default function CoverageKpisSection({ coverage }: CoverageKpisSectionProps) {
  const items = [coverage.team, coverage.product, coverage.owner];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Allocation Coverage</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {items.map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.label}</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(item.valuePct)}</p>
            <p
              className={[
                'mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                stateClass[item.state],
              ].join(' ')}
            >
              {item.state}
            </p>
          </article>
        ))}
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unallocated</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(coverage.unallocatedAmount)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-600">
            {formatPercent(coverage.unallocatedPct)} of scoped spend
          </p>
        </article>
      </div>
    </section>
  );
}
