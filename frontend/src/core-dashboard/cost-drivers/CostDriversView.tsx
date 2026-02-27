import React from 'react';
import {
  DecompositionSection,
  DriverControlsSection,
  DriverDetailModal,
  ExecutiveInsightsSection,
  KpiStripSection,
  StatusBanner,
  UnexplainedVarianceSection,
  VarianceTrendSection,
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
  trendComparison,
  decomposition,
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] xl:items-start">
        <div className="min-w-0">
          <WaterfallSection waterfall={waterfall} />
        </div>
        <div className="min-w-0">
          <UnexplainedVarianceSection
            unexplainedVariance={unexplainedVariance}
            attributionConfidence={attributionConfidence}
            runMeta={runMeta}
            trust={trust}
          />
        </div>
      </div>

      <div className="min-w-0">
        <VarianceTrendSection trendComparison={trendComparison} />
      </div>

      <DecompositionSection
        decomposition={decomposition}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenDetail={onOpenDriver}
      />

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



