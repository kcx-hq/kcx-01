import React, { useState } from 'react';
import AllocationUnitEconomicsView from './AllocationUnitEconomicsView';
import type { AllocationUnitEconomicsControls } from './types';
import { useAllocationUnitEconomicsData } from './hooks/useAllocationUnitEconomicsData';

interface AllocationUnitEconomicsProps {
  filters: { provider?: string; service?: string; region?: string };
  api: { call: (module: string, endpoint: string, options?: Record<string, unknown>) => Promise<unknown> } | null;
  caps: Record<string, unknown> | null;
}

const INITIAL_CONTROLS: AllocationUnitEconomicsControls = {
  period: '30d',
  basis: 'actual',
  compareTo: 'previous_period',
  unitMetric: 'consumed_quantity',
};

export default function AllocationUnitEconomics({ filters, api, caps }: AllocationUnitEconomicsProps) {
  const modules = (caps as { modules?: Record<string, { enabled?: boolean }> }).modules || {};
  const isEnabled = Boolean(api && caps && (modules.unitEconomics?.enabled || modules.governance?.enabled));

  const [controls, setControls] = useState<AllocationUnitEconomicsControls>(INITIAL_CONTROLS);
  const { loading, error, model } = useAllocationUnitEconomicsData({
    api,
    caps,
    filters,
    controls,
  });

  const onControlsChange = (patch: Partial<AllocationUnitEconomicsControls>) =>
    setControls((prev) => ({ ...prev, ...patch }));

  if (!isEnabled) return null;

  return (
    <AllocationUnitEconomicsView
      loading={loading}
      error={error}
      controls={controls}
      onControlsChange={onControlsChange}
      model={model}
    />
  );
}
