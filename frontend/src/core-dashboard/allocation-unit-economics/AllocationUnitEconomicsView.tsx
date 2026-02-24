import React from 'react';
import type { AllocationUnitEconomicsControls, AllocationUnitEconomicsViewModel } from './types';
import {
  CoverageKpisSection,
  ExportSection,
  GlobalControlsSection,
  OwnershipHeatmapSection,
  SharedPoolSection,
  ShowbackTableSection,
  UnitTrendSection,
  VarianceSection,
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
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm font-semibold text-slate-600">
        Building allocation and unit economics view...
      </div>
    );
  }

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

      <CoverageKpisSection coverage={model.coverage} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr] xl:items-start">
        <div className="min-w-0">
          <ShowbackTableSection rows={model.showbackRows} />
        </div>
        <div className="min-w-0">
          <SharedPoolSection model={model.sharedPool} />
        </div>
      </div>

      <UnitTrendSection model={model.kpis} />
      <VarianceSection teamRows={model.teamVariance} productRows={model.productVariance} />
      <OwnershipHeatmapSection cells={model.heatmap} />
      <ExportSection rows={model.exportRows} />

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
