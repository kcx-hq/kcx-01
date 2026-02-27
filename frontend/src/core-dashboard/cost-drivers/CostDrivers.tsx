import React, { useMemo } from 'react';
import { CostDriversView } from './CostDriversView';
import { useCostDriversControls, useCostDriversData, useDriverDetails } from './hooks';
import type {
  CostDriversApi,
  CostDriversCaps,
  CostDriversFilters,
} from './types';

interface CostDriversProps {
  filters: CostDriversFilters;
  api: CostDriversApi;
  caps: CostDriversCaps;
}

export default function CostDrivers({ filters, api, caps }: CostDriversProps) {
  const {
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
  } = useCostDriversControls();

  const data = useCostDriversData({
    api,
    caps,
    filters,
    period,
    dimension: controlsState.dimension,
    minChange: controlsState.minChange,
    rowLimit: controlsState.rowLimit,
    timeRange: controlsState.timeRange,
    compareTo: controlsState.compareTo,
    costBasis: controlsState.costBasis,
    startDate: controlsState.startDate || null,
    endDate: controlsState.endDate || null,
    previousStartDate: controlsState.previousStartDate || null,
    previousEndDate: controlsState.previousEndDate || null,
  });

  const effectiveActiveTab = useMemo(
    () => activeTab || data?.decomposition?.activeTab || controlsState.dimension || 'service',
    [activeTab, data?.decomposition?.activeTab, controlsState.dimension],
  );

  const details = useDriverDetails({
    api,
    caps,
    driver: selectedDriver,
    period,
    filters,
    timeRange: controlsState.timeRange,
    compareTo: controlsState.compareTo,
    costBasis: controlsState.costBasis,
    startDate: controlsState.startDate || null,
    endDate: controlsState.endDate || null,
    previousStartDate: controlsState.previousStartDate || null,
    previousEndDate: controlsState.previousEndDate || null,
  });

  return (
    <CostDriversView
      api={api}
      caps={caps}
      loading={data.loading}
      isRefreshing={data.isRefreshing}
      errorMessage={data.errorMessage}
      controlsState={controlsState}
      onControlsChange={onControlsChange}
      onResetControls={onResetControls}
      kpiStrip={data.kpiStrip}
      activeKpiId={activeKpiId}
      onToggleKpi={onToggleKpi}
      waterfall={data.waterfall}
      trendComparison={data.trendComparison}
      decomposition={data.decomposition}
      activeTab={effectiveActiveTab}
      onTabChange={setActiveTab}
      onOpenDriver={onOpenDriver}
      unexplainedVariance={data.unexplainedVariance}
      attributionConfidence={data.attributionConfidence}
      runMeta={data.runMeta}
      trust={data.trust}
      executiveInsights={data.executiveInsights}
      selectedDriver={selectedDriver}
      details={details.stats}
      detailLoading={details.loading}
      onCloseDetails={onCloseDetails}
    />
  );
}



