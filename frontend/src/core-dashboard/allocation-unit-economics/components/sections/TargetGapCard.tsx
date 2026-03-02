import React from 'react';
import type { AllocationUnitEconomicsViewModel } from '../../types';
import { formatNumber, formatPercent } from '../../utils/format';

interface TargetGapCardProps {
  model: AllocationUnitEconomicsViewModel;
}

export default function TargetGapCard({ model }: TargetGapCardProps) {
  const target = model.kpis.target;
  const hasTarget = target.targetUnitCost !== null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Target Gap</h3>
      </div>

      {hasTarget ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Target Unit Cost</p>
            <p className="mt-1 text-lg font-black text-slate-900">{formatNumber(target.targetUnitCost || 0, 6)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Actual Unit Cost</p>
            <p className="mt-1 text-lg font-black text-slate-900">{formatNumber(model.kpis.avgUnitPrice, 6)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Gap</p>
            <p className="mt-1 text-lg font-black text-slate-900">{formatNumber(target.gapValue || 0, 6)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Gap %</p>
            <p className="mt-1 text-lg font-black text-slate-900">{formatPercent(target.gapPct)}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
          No target configured for selected metric and scope.
        </div>
      )}
    </section>
  );
}
