import React from 'react';
import {
  DecompositionSection,
  DriverControlsSection,
  DriverDetailModal,
  ExecutiveInsightsSection,
  KpiStripSection,
  RateVsUsageSection,
  StatusBanner,
  UnexplainedVarianceSection,
  WaterfallSection,
} from './components';
import type { CostDriversViewProps } from './types';

export function CostDriversView({
  api,
  caps,
  loading,
  isRefreshing,
  errorMessage,
  controlsState,
  onControlsChange,
  onResetControls,
  kpiStrip,
  activeKpiId,
  onToggleKpi,
  waterfall,
  decomposition,
  topDrivers,
  rateVsUsage,
  activeTab,
  onTabChange,
  onOpenDriver,
  unexplainedVariance,
  attributionConfidence,
  runMeta,
  trust,
  executiveInsights,
  selectedDriver,
  details,
  detailLoading,
  onCloseDetails,
}: CostDriversViewProps) {
  if (!api || !caps || !caps.modules?.costDrivers?.enabled) return null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm font-semibold text-slate-600">
        Building cost driver variance...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DriverControlsSection
        controls={controlsState}
        onControlsChange={onControlsChange}
        onReset={onResetControls}
      />

      {errorMessage ? <StatusBanner variant="error" message={errorMessage} /> : null}

      {isRefreshing ? <StatusBanner variant="refresh" message="Refreshing variance model..." /> : null}

      <KpiStripSection cards={kpiStrip} activeKpiId={activeKpiId} onToggleKpi={onToggleKpi} />

      <div className="min-w-0">
        <WaterfallSection waterfall={waterfall} />
      </div>

      <DecompositionSection
        decomposition={decomposition}
        topDrivers={topDrivers}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenDetail={onOpenDriver}
      />

      <RateVsUsageSection rateVsUsage={rateVsUsage} onOpenDetail={onOpenDriver} />

      <div className="min-w-0">
        <UnexplainedVarianceSection
          unexplainedVariance={unexplainedVariance}
          attributionConfidence={attributionConfidence}
          runMeta={runMeta}
          trust={trust}
        />
      </div>

      <ExecutiveInsightsSection executiveInsights={executiveInsights} onOpenDetail={onOpenDriver} />

      <DriverDetailModal
        open={Boolean(selectedDriver)}
        driver={selectedDriver}
        details={details}
        loading={detailLoading}
        onClose={onCloseDetails}
      />
    </div>
  );
}



