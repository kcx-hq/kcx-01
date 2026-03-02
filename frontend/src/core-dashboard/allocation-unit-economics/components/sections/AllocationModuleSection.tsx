import React from 'react';
import type { AllocationUnitEconomicsControls, AllocationUnitEconomicsViewModel } from '../../types';
import AllocationOverviewSection from './AllocationOverviewSection';
import ShowbackTableSection from './ShowbackTableSection';
import SharedPoolTransparencySection from './SharedPoolTransparencySection';
import AllocationConfidencePanel from './AllocationConfidencePanel';
import OwnershipDriftTrend from './OwnershipDriftTrend';

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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <AllocationOverviewSection model={model.allocationOverview} contextLabel={kpiContextLabel} />
        <AllocationConfidencePanel model={model.allocationOverview.allocationConfidence} />
      </div>

      <ShowbackTableSection
        rows={model.showbackRows}
        coverage={model.coverage}
        sharedPool={model.sharedPool}
        costBasis={controls.basis}
        periodLabel={model.periodLabel}
        timeWindowLabel={model.kpis.comparisonLabel}
      />

      <SharedPoolTransparencySection rows={model.sharedPoolTransparency} />
      <OwnershipDriftTrend model={model.ownershipDrift} />
    </div>
  );
}

