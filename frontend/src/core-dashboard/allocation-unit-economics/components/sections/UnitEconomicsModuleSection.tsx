import React from 'react';
import type { AllocationUnitEconomicsViewModel } from '../../types';
import UnitTrendSection from './UnitTrendSection';
import UnitBenchmarkSection from './UnitBenchmarkSection';
import MarginOverlaySection from './MarginOverlaySection';
import VarianceSection from './VarianceSection';

interface UnitEconomicsModuleSectionProps {
  model: AllocationUnitEconomicsViewModel;
}

export default function UnitEconomicsModuleSection({ model }: UnitEconomicsModuleSectionProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-800">
          Unit Economics uses Final Allocated Cost (Direct + Shared) as source of truth.
        </p>
      </section>

      <UnitTrendSection model={model.kpis} />
      <UnitBenchmarkSection
        teamProductRows={model.teamProductUnitRows}
        environmentRows={model.environmentUnitRows}
      />
      <MarginOverlaySection model={model.margin} />
      <VarianceSection teamRows={model.teamVariance} productRows={model.productVariance} />
    </div>
  );
}
