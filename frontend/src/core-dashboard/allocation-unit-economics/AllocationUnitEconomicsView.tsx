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

type ModuleKey = 'allocation' | 'unit_economics';

const MODULES: Array<{ key: ModuleKey; label: string; description: string }> = [
  {
    key: 'allocation',
    label: 'Allocation',
    description: 'Ownership mapping, showback/chargeback, and shared pool transparency.',
  },
  {
    key: 'unit_economics',
    label: 'Unit Economics',
    description: 'Per-unit performance and efficiency based on final allocated cost.',
  },
];

export default function AllocationUnitEconomicsView({
  loading,
  error,
  controls,
  onControlsChange,
  model,
}: AllocationUnitEconomicsViewProps) {
  const [activeModule, setActiveModule] = useState<ModuleKey>('allocation');

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
          Scope: {model.periodLabel} | Basis: {controls.basis.toUpperCase()} | Compare: {controls.compareTo.replaceAll('_', ' ')}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {MODULES.map((module) => {
            const active = module.key === activeModule;
            return (
              <button
                key={module.key}
                type="button"
                onClick={() => setActiveModule(module.key)}
                className={[
                  'rounded-lg border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition',
                  active
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40',
                ].join(' ')}
              >
                {module.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-600">
          {MODULES.find((module) => module.key === activeModule)?.description}
        </p>
      </section>

      {activeModule === 'allocation' ? (
        <AllocationModuleSection controls={controls} model={model} kpiContextLabel={kpiContextLabel} />
      ) : (
        <UnitEconomicsModuleSection model={model} />
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-black uppercase tracking-wider text-slate-800">Governance Notes</h3>
        <ul className="space-y-1 text-sm font-semibold text-slate-600">
          {model.notes.map((note) => (
            <li key={note}>- {note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
