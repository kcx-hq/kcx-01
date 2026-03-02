import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AllocationUnitEconomicsViewModel } from '../../types';
import { formatNumber } from '../../utils/format';

interface UnitDecompositionWaterfallProps {
  model: AllocationUnitEconomicsViewModel;
}

export default function UnitDecompositionWaterfall({ model }: UnitDecompositionWaterfallProps) {
  const gate = model.denominatorGate;
  if (gate.status === 'fail') {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Unit Decomposition Waterfall</h3>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-10 text-center text-sm font-semibold text-amber-800">
          Decomposition is hidden due to denominator gate failure.
        </div>
      </section>
    );
  }

  const rows = (model.kpis.decomposition.components || []).map((item) => ({
    name: item.label,
    value: Number(item.value || 0),
    contributionPct: Number(item.contributionPct || 0),
  }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Unit Decomposition Waterfall</h3>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Start: {formatNumber(model.kpis.decomposition.startUnitCost, 6)}</span>
          <span>End: {formatNumber(model.kpis.decomposition.endUnitCost, 6)}</span>
          <span>Validation: {formatNumber(model.kpis.decomposition.validationDelta, 6)}</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dbe2ea" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={56} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip formatter={(value) => formatNumber(Number(value || 0), 6)} />
              <Bar dataKey="value">
                {rows.map((row, index) => (
                  <Cell key={`${row.name}-${index}`} fill={row.value >= 0 ? '#f59e0b' : '#23a282'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
