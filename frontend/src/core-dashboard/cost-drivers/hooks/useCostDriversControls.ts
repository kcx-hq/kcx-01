import { useState } from 'react';
import { DEFAULT_ACTIVE_TAB, INITIAL_COST_DRIVERS_CONTROLS } from '../config/defaults';
import type { CostDriversControlsState, CostDriversDecompositionRow } from '../types';
import { getPeriodFromTimeRange } from '../utils/timeRange';

export function useCostDriversControls() {
  const [controlsState, setControlsState] =
    useState<CostDriversControlsState>(INITIAL_COST_DRIVERS_CONTROLS);
  const [activeKpiId, setActiveKpiId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<CostDriversDecompositionRow | null>(null);
  const [activeTab, setActiveTab] = useState(DEFAULT_ACTIVE_TAB);

  const period = getPeriodFromTimeRange(controlsState.timeRange);

  const onControlsChange = (patch: Partial<CostDriversControlsState>) => {
    setControlsState((prev) => {
      const next = { ...prev, ...patch };
      if (patch.timeRange && patch.timeRange !== 'custom') {
        next.startDate = '';
        next.endDate = '';
      }
      if (patch.compareTo && patch.compareTo !== 'custom_previous') {
        next.previousStartDate = '';
        next.previousEndDate = '';
      }
      if (patch.dimension) setActiveTab(patch.dimension);
      return next;
    });
  };

  const onResetControls = () => {
    setControlsState(INITIAL_COST_DRIVERS_CONTROLS);
    setActiveTab(DEFAULT_ACTIVE_TAB);
    setActiveKpiId(null);
    setSelectedDriver(null);
  };

  const onToggleKpi = (id: string) => setActiveKpiId((prev) => (prev === id ? null : id));
  const onOpenDriver = (driver: CostDriversDecompositionRow) => setSelectedDriver(driver);
  const onCloseDetails = () => setSelectedDriver(null);

  return {
    controlsState,
    activeKpiId,
    selectedDriver,
    activeTab,
    period,
    setActiveTab,
    onControlsChange,
    onResetControls,
    onToggleKpi,
    onOpenDriver,
    onCloseDetails,
  };
}
