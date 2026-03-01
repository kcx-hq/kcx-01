import React from 'react';
import type { AllocationOverviewModel } from '../../types';
import { formatPercent } from '../../utils/format';

interface AllocationConfidencePanelProps {
  model: AllocationOverviewModel['allocationConfidence'];
}

const levelTone: Record<string, string> = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function AllocationConfidencePanel({ model }: AllocationConfidencePanelProps) {
  const tone = levelTone[String(model?.level || 'low').toLowerCase()] || levelTone.low;
  const factors = [
    { label: 'Coverage', value: model?.factors?.tagCoveragePct ?? 0 },
    { label: 'Shared Pool Ratio', value: model?.factors?.sharedPoolRatioPct ?? 0 },
    { label: 'Rule Completeness', value: model?.factors?.ruleCompletenessPct ?? 0 },
    { label: 'Data Consistency', value: model?.factors?.dataConsistencyPct ?? 0 },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Allocation Confidence</h3>
        <span className={['rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider', tone].join(' ')}>
          {String(model?.level || 'low')}
        </span>
      </div>
      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Confidence Score</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{formatPercent(model?.score ?? 0)}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {factors.map((factor) => (
          <div key={factor.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{factor.label}</p>
            <p className="mt-1 text-sm font-black text-slate-900">{formatPercent(factor.value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
