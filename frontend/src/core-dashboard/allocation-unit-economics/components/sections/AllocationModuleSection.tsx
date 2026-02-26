import React from 'react';
import type { AllocationUnitEconomicsControls, AllocationUnitEconomicsViewModel } from '../../types';
import AllocationOverviewSection from './AllocationOverviewSection';
import CoverageKpisSection from './CoverageKpisSection';
import UnallocatedIntegritySection from './UnallocatedIntegritySection';
import ShowbackTableSection from './ShowbackTableSection';
import SharedPoolSection from './SharedPoolSection';
import SharedPoolTransparencySection from './SharedPoolTransparencySection';
import OwnershipHeatmapSection from './OwnershipHeatmapSection';
import ExportSection from './ExportSection';

interface AllocationModuleSectionProps {
  controls: AllocationUnitEconomicsControls;
  model: AllocationUnitEconomicsViewModel;
  kpiContextLabel: string;
}

export default function AllocationModuleSection({
  controls,
  model,
  kpiContextLabel,
}: AllocationModuleSectionProps) {
  return (
    <div className="space-y-4">
      <AllocationOverviewSection model={model.allocationOverview} contextLabel={kpiContextLabel} />
      <CoverageKpisSection coverage={model.coverage} contextLabel={kpiContextLabel} />
      <UnallocatedIntegritySection model={model.unallocatedInsight} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr] xl:items-start">
        <div className="min-w-0">
          <ShowbackTableSection
            rows={model.showbackRows}
            coverage={model.coverage}
            sharedPool={model.sharedPool}
            costBasis={controls.basis}
            periodLabel={model.periodLabel}
            timeWindowLabel={model.kpis.comparisonLabel}
          />
        </div>
        <div className="min-w-0">
          <SharedPoolSection model={model.sharedPool} contextLabel={kpiContextLabel} />
        </div>
      </div>

      <SharedPoolTransparencySection rows={model.sharedPoolTransparency} />
      <OwnershipHeatmapSection cells={model.heatmap} />
      <ExportSection rows={model.exportRows} />
    </div>
  );
}

