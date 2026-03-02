import React from 'react';
import type { AllocationUnitEconomicsViewModel } from '../../types';
import UnitBenchmarkSection from './UnitBenchmarkSection';
import UnitTrendCharts from './UnitTrendCharts';
import UnitKpiStrip from './UnitKpiStrip';
import UnitDecompositionWaterfall from './UnitDecompositionWaterfall';
import TargetGapCard from './TargetGapCard';
import DenominatorGateBadge from './DenominatorGateBadge';

interface UnitEconomicsModuleSectionProps {
  model: AllocationUnitEconomicsViewModel;
}

export default function UnitEconomicsModuleSection({ model }: UnitEconomicsModuleSectionProps) {
  const gate = model.denominatorGate;
  const allowDecomposition = gate.status !== 'fail';
  const allowBenchmarks = gate.status !== 'fail';
  const gateMessage =
    gate.status === 'pass'
      ? 'Denominator quality is passing. Unit KPI and benchmark comparisons are trusted.'
      : gate.status === 'warn'
        ? 'Denominator quality is partial. Review highlighted reasons before relying on ranking decisions.'
        : 'Denominator quality failed. Decomposition and benchmark ranking are restricted.';

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Denominator Quality Gate</h3>
          <DenominatorGateBadge status={gate.status} reasons={gate.reasons} metric={gate.metric} />
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-600">{gateMessage}</p>
      </section>

      <UnitKpiStrip model={model} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Unit Cost Trend</h3>
        </div>
        <UnitTrendCharts trend={model.kpis.trend} targetUnitCost={model.kpis.target.targetUnitCost} />
      </section>

      {allowDecomposition ? <UnitDecompositionWaterfall model={model} /> : null}

      {allowBenchmarks ? (
        <UnitBenchmarkSection
          teamProductRows={model.teamProductUnitRows}
          environmentRows={model.environmentUnitRows}
        />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Benchmarks</h3>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm font-semibold text-amber-800">
            Benchmark ranking is hidden due to denominator gate failure.
          </div>
        </section>
      )}

      <TargetGapCard model={model} />
    </div>
  );
}
