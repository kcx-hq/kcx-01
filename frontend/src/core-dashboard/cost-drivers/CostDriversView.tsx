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
import { SectionLoading, SectionRefreshOverlay } from '../common/SectionStates';
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
    return <SectionLoading label="Analyzing Cost Drivers..." />;
  }

  return (
    <div className="space-y-4">
      <DriverControlsSection
        controls={controlsState}
        onControlsChange={onControlsChange}
        onReset={onResetControls}
      />

      {errorMessage ? <StatusBanner variant="error" message={errorMessage} /> : null}

      <div className="relative space-y-4">
        {isRefreshing ? (
          <SectionRefreshOverlay rounded="rounded-2xl" label="Refreshing cost drivers..." />
        ) : null}

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
      </div>

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



