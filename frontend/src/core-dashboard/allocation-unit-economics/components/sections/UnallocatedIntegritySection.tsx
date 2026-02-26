import React from 'react';
import type { UnallocatedInsightModel } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';

interface UnallocatedIntegritySectionProps {
  model: UnallocatedInsightModel;
}

const maturityClass: Record<UnallocatedInsightModel['governanceMaturity'], string> = {
  strong: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  weak: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function UnallocatedIntegritySection({ model }: UnallocatedIntegritySectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Unallocated Spend Impact</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unallocated Amount</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(model.unallocatedAmount)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">% of Total</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.unallocatedPct)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tag Coverage</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.tagCoveragePct)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Governance Maturity</p>
          <p className={['mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider', maturityClass[model.governanceMaturity]].join(' ')}>
            {model.governanceMaturity}
          </p>
        </article>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
        <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
          Top Contributing Services (Unallocated)
        </p>
        <div className={model.topContributingServices.length > 6 ? 'max-h-[260px] overflow-y-auto custom-scrollbar' : ''}>
          {model.topContributingServices.length ? (
            model.topContributingServices.map((item) => (
              <div key={item.service} className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm last:border-b-0">
                <span className="font-semibold text-slate-700">{item.service}</span>
                <span className="font-black text-slate-900">{formatCurrency(item.amount)}</span>
              </div>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-sm font-semibold text-slate-500">
              No unallocated services detected.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

