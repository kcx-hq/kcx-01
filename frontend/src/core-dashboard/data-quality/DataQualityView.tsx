import { useMemo, useState } from "react";
import { DataQualityStates } from "./components/DataQualityStates";
import {
  ControlViolationsTable,
  CoverageGatesTable,
  CurrencyBasisChecksPanel,
  DenominatorQualityGatePanel,
  FreshnessStatusCards,
  OwnershipCompletenessScorecards,
  QualityImpactBanner,
  TagComplianceMatrix,
} from "./components/governance";
import { ExecutiveHeader, InsightsActionsPanel, SectionToggle } from "./components/overview";
import {
  buildDataQualityActions,
  buildDataQualityInsights,
  buildGovernanceActions,
  buildGovernanceInsights,
  type SectionView,
} from "./components/overview/overview.models";
import { useGovernanceFilters } from "./hooks/useGovernanceFilters";
import { useQualityBanner } from "./hooks/useQualityBanner";
import { useFreshnessData } from "./hooks/useFreshnessData";
import { useCoverageData } from "./hooks/useCoverageData";
import { useTagComplianceData } from "./hooks/useTagComplianceData";
import { useOwnershipCompletenessData } from "./hooks/useOwnershipCompletenessData";
import { useCurrencyBasisData } from "./hooks/useCurrencyBasisData";
import { useDenominatorQualityData } from "./hooks/useDenominatorQualityData";
import { useControlViolationsData } from "./hooks/useControlViolationsData";
import type { ApiClient, Capabilities } from "../../services/apiClient";
import type { GovernanceFilters } from "./types";
import { formatPercent } from "./utils/governance.format";
import { SectionRefreshOverlay } from "../common/SectionStates";

interface DataQualityViewProps {
  filters?: GovernanceFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

const DataQualityView = ({ filters, api, caps }: DataQualityViewProps) => {
  const [activeSection, setActiveSection] = useState<SectionView>("governance");
  const params = useGovernanceFilters(filters);

  const banner = useQualityBanner({ api, caps, params });
  const freshness = useFreshnessData({ api, caps, params });
  const coverage = useCoverageData({ api, caps, params });
  const tagCompliance = useTagComplianceData({ api, caps, params });
  const ownership = useOwnershipCompletenessData({ api, caps, params });
  const currencyBasis = useCurrencyBasisData({ api, caps, params });
  const denominator = useDenominatorQualityData({ api, caps, params });
  const controlViolations = useControlViolationsData({ api, caps, params });

  const loading =
    banner.loading ||
    freshness.loading ||
    coverage.loading ||
    tagCompliance.loading ||
    ownership.loading ||
    currencyBasis.loading ||
    denominator.loading ||
    controlViolations.loading;
  const isRefreshing =
    banner.refreshing ||
    freshness.refreshing ||
    coverage.refreshing ||
    tagCompliance.refreshing ||
    ownership.refreshing ||
    currencyBasis.refreshing ||
    denominator.refreshing ||
    controlViolations.refreshing;

  const hasAnyData =
    Boolean(banner.data) ||
    Boolean(freshness.data) ||
    Boolean(coverage.data) ||
    Boolean(tagCompliance.data) ||
    Boolean(ownership.data) ||
    Boolean(currencyBasis.data) ||
    Boolean(denominator.data) ||
    Boolean(controlViolations.data);

  const freshnessLag = Number(freshness.data?.summary?.freshness_lag_hours || 0);
  const reliabilityScore = Number(freshness.data?.summary?.reliability_score || 0);
  const duplicatesPct = Number(freshness.data?.summary?.duplicate_load_pct || 0);
  const missingDays = Number(coverage.data?.gates?.missing_days?.value || 0);
  const coverageCompleteness = Number(coverage.data?.summary?.coverage_completeness_pct || 0);
  const denominatorAvailability = Number(denominator.data?.availability_pct || 0);
  const denominatorSeverity = String(denominator.data?.severity || "fail");

  const tagCompliancePct = Number(tagCompliance.data?.spend_weighted_compliance_pct || 0);
  const allocatedPct = Number(ownership.data?.coverage?.allocated_pct || 0);
  const mismatchPct = Number(currencyBasis.data?.mismatch_spend_pct || 0);
  const violatedPct = Number(controlViolations.data?.summary?.violated_spend_pct || 0);
  const violationCount = Number(controlViolations.data?.summary?.violation_count || 0);

  const dataQualityInsights = useMemo(
    () =>
      buildDataQualityInsights({
        freshnessLagHours: freshness.data?.summary?.freshness_lag_hours,
        freshnessSeverity: freshness.data?.severity,
        reliabilityScore,
        coverageCompleteness,
        coverageSeverity: coverage.data?.severity,
        duplicatesPct,
        duplicateSeverity: coverage.data?.gates?.duplicates?.status,
        denominatorAvailability,
        denominatorSeverity,
      }),
    [
      coverageCompleteness,
      coverage.data?.gates?.duplicates?.status,
      coverage.data?.severity,
      denominatorAvailability,
      denominatorSeverity,
      duplicatesPct,
      freshness.data?.severity,
      freshness.data?.summary?.freshness_lag_hours,
      reliabilityScore,
    ],
  );

  const governanceInsights = useMemo(
    () =>
      buildGovernanceInsights({
        tagCompliance: tagCompliance.data,
        ownership: ownership.data,
        currencyBasis: currencyBasis.data,
        violationPct: violatedPct,
        violationCount,
        violationsSeverity: controlViolations.data?.severity,
        governanceConfidence: banner.data?.confidence_level,
      }),
    [
      banner.data?.confidence_level,
      controlViolations.data?.severity,
      currencyBasis.data,
      ownership.data,
      tagCompliance.data,
      violatedPct,
      violationCount,
    ],
  );

  const dataQualityActions = useMemo(
    () =>
      buildDataQualityActions({
        freshnessLagHours: freshnessLag,
        missingDays,
        duplicates: Number(coverage.data?.gates?.duplicates?.value || 0),
        denominatorSeverity,
      }),
    [coverage.data?.gates?.duplicates?.value, denominatorSeverity, freshnessLag, missingDays],
  );

  const governanceActions = useMemo(
    () =>
      buildGovernanceActions({
        tagCompliancePct,
        allocatedPct,
        mismatchPct,
        violatedPct,
      }),
    [allocatedPct, mismatchPct, tagCompliancePct, violatedPct],
  );

  if (loading && !hasAnyData) return <DataQualityStates type="loading" />;
  if (!hasAnyData) return <DataQualityStates type="empty" />;

  return (
    <div className="core-shell animate-in fade-in duration-300 space-y-4">
      <div className="relative space-y-4">
        {isRefreshing ? (
          <SectionRefreshOverlay rounded="rounded-2xl" label="Refreshing data quality & governance..." />
        ) : null}
        <ExecutiveHeader confidenceLevel={banner.data?.confidence_level} />

        <QualityImpactBanner banner={banner.data} />

        <SectionToggle activeSection={activeSection} onChange={setActiveSection} />

        {activeSection === "data-quality" ? (
          <InsightsActionsPanel
            title="Data Quality"
            badgeLabel="Reliability"
            badgeValue={`${reliabilityScore.toFixed(2)} / 100`}
            insights={dataQualityInsights}
            actions={dataQualityActions}
          >
            <FreshnessStatusCards data={freshness.data} />
            <CoverageGatesTable data={coverage.data} />
            <DenominatorQualityGatePanel data={denominator.data} />
          </InsightsActionsPanel>
        ) : null}

        {activeSection === "governance" ? (
          <InsightsActionsPanel
            title="Governance"
            badgeLabel="Violated Spend"
            badgeValue={formatPercent(violatedPct)}
            insights={governanceInsights}
            actions={governanceActions}
          >
            <TagComplianceMatrix data={tagCompliance.data} />
            <OwnershipCompletenessScorecards data={ownership.data} />
            <CurrencyBasisChecksPanel data={currencyBasis.data} />
            <ControlViolationsTable data={controlViolations.data} />
          </InsightsActionsPanel>
        ) : null}
      </div>
    </div>
  );
};

export default DataQualityView;
