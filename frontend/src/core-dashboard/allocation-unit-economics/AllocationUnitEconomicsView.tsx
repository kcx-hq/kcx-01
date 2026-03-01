import React, { useState } from 'react';
import type { AllocationUnitEconomicsControls, AllocationUnitEconomicsViewModel } from './types';
import {
  AllocationModuleSection,
  GlobalControlsSection,
  UnitEconomicsModuleSection,
} from './components/sections';

interface AllocationUnitEconomicsViewProps {
  loading: boolean;
  error: string | null;
  controls: AllocationUnitEconomicsControls;
  onControlsChange: (patch: Partial<AllocationUnitEconomicsControls>) => void;
  model: AllocationUnitEconomicsViewModel;
}

export default function AllocationUnitEconomicsView({
  loading,
  error,
  controls,
  onControlsChange,
  model,
}: AllocationUnitEconomicsViewProps) {
  const [activeSection, setActiveSection] = useState<'allocation' | 'unit-economics'>('allocation');

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm font-semibold text-slate-600">
        Building allocation and unit economics view...
      </div>
    );
  }

  const kpiContextLabel = `${model.periodLabel} | ${model.kpis.comparisonLabel}`;

  return (
    <div className="space-y-4">
      <GlobalControlsSection controls={controls} onChange={onControlsChange} />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs font-black uppercase tracking-wider text-slate-700">
          Scope: {model.periodLabel} | Basis: {controls.basis.toUpperCase()} | Compare: {controls.compareTo.replaceAll('_', ' ')} | Unit Metric: {controls.unitMetric.replaceAll('_', ' ')}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('allocation')}
            className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition ${
              activeSection === 'allocation'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            Ownership & Allocation
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('unit-economics')}
            className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition ${
              activeSection === 'unit-economics'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            Unit Economics & Efficiency
          </button>
        </div>
      </section>

      {activeSection === 'allocation' ? (
        <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm" id="ownership-allocation">
          <AllocationModuleSection controls={controls} model={model} kpiContextLabel={kpiContextLabel} />
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm" id="unit-economics">
          <UnitEconomicsModuleSection model={model} />
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-black uppercase tracking-wider text-slate-800">Trust Cues</h3>
        <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Data Freshness</p>
            <p className="mt-1 text-xs font-black text-slate-800">
              {model.trust.dataFreshnessTs ? new Date(model.trust.dataFreshnessTs).toLocaleString('en-US') : 'N/A'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Coverage</p>
            <p className="mt-1 text-xs font-black text-slate-800">{model.trust.coveragePct.toFixed(2)}%</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Confidence</p>
            <p className="mt-1 text-xs font-black text-slate-800">{String(model.trust.confidenceLevel || 'low')}</p>
          </div>
        </div>
        <ul className="space-y-1 text-sm font-semibold text-slate-600">
          {model.notes.map((note) => (
            <li key={note}>- {note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
