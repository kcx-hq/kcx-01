import React from 'react';
import type { AllocationUnitEconomicsViewModel } from '../../types';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/format';
import DenominatorGateBadge from './DenominatorGateBadge';

interface UnitKpiStripProps {
  model: AllocationUnitEconomicsViewModel;
}

export default function UnitKpiStrip({ model }: UnitKpiStripProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Unit KPI Strip</h3>
        <DenominatorGateBadge
          status={model.denominatorGate.status}
          reasons={model.denominatorGate.reasons}
          metric={model.denominatorGate.metric}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Cost</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(model.kpis.totalCost)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Volume</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatNumber(model.kpis.totalQuantity, 2)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Average Unit Cost</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatNumber(model.kpis.avgUnitPrice, 6)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unit Cost Delta</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.kpis.unitPriceChangePct)}</p>
        </article>
      </div>
      {model.denominatorGate.status !== 'pass' ? (
        <p className="mt-2 text-xs font-semibold text-amber-700">Limited confidence: denominator quality gate is not fully passing.</p>
      ) : null}
    </section>
  );
}
