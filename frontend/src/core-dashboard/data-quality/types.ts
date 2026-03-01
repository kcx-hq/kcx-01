import type { ApiClient, Capabilities } from "../../services/apiClient";
import type { DashboardFilters } from "../dashboard/types";

export type RiskLevel = "green" | "amber" | "red";

export interface GovernanceRisk {
  id: string;
  title: string;
  level: RiskLevel;
  value: number;
  threshold: string;
  impactedSpend: number;
  impactPct?: number;
  owner: string;
  steps: string[];
}

export interface GovernanceScoreSet {
  tagComplianceScore: number;
  allocationConfidenceScore: number;
  sharedPoolHealthScore: number;
  ingestionReliabilityScore: number;
  denominatorCoverageScore: number;
  policyComplianceScore: number;
  costBasisConsistencyScore: number;
}

export interface GovernanceOverview {
  state: RiskLevel;
  trustScore: number;
  scores: GovernanceScoreSet;
  topRisks: GovernanceRisk[];
}

export interface CoverageByKeyRow {
  key: string;
  coveragePct: number;
  invalidValuePct: number;
}

export interface CoverageTrendRow {
  date: string;
  tagCoveragePct: number;
  ownershipCoveragePct: number;
  sharedPoolPct: number;
  denominatorCoveragePct: number;
}

export interface TopMissingServiceRow {
  service: string;
  spend: number;
  spendPct: number;
}

export interface TopMissingAccountRow {
  account: string;
  spend: number;
  spendPct: number;
}

export interface TagMetadataSection {
  tagCoveragePct: number;
  untaggedSpend: number;
  untaggedSpendPct: number;
  invalidValuePct: number;
  coverageByKey: CoverageByKeyRow[];
  trend: CoverageTrendRow[];
  topMissingByService: TopMissingServiceRow[];
  topMissingByAccount: TopMissingAccountRow[];
}

export interface OwnershipAllocationSection {
  allocatedPct: number;
  unallocatedPct: number;
  unallocatedSpend: number;
  unallocatedTrendMoM: number;
  allocationConfidenceScore: number;
  ruleChurnRate: number;
  mappingStabilityPct: number;
}

export interface SharedGrowthContributor {
  service: string;
  currentSpend: number;
  previousSpend: number;
  delta: number;
}

export interface SharedPoolIntegritySection {
  sharedPoolSpend: number;
  sharedPoolPct: number;
  poolDrift: number;
  leakageSpend: number;
  leakagePct: number;
  basisStabilityScore: number;
  topContributorsToGrowth: SharedGrowthContributor[];
}

export interface SeveritySummaryRow {
  severity: "critical" | "high" | "medium" | "low";
  count: number;
  violatedSpend: number;
  violatedSpendPct: number;
}

export interface ViolatingOwnerRow {
  owner: string;
  violatedSpend: number;
  violatedSpendPct: number;
}

export interface ViolatingServiceRow {
  service: string;
  violatedSpend: number;
  violatedSpendPct: number;
}

export interface ViolatingAccountRow {
  account: string;
  violatedSpend: number;
  violatedSpendPct: number;
}

export interface PolicyComplianceSection {
  violationsCount: number;
  violatedSpend: number;
  violatedSpendPct: number;
  severitySummary: SeveritySummaryRow[];
  violationsTrend: Array<{ date: string; violatedSpendPct: number }>;
  topViolatingTeams: ViolatingOwnerRow[];
  topViolatingServices: ViolatingServiceRow[];
  topViolatingAccounts: ViolatingAccountRow[];
}

export interface IngestionReliabilitySection {
  lastSuccessfulIngestion: string | null;
  freshnessLagHours: number | null;
  missingDays30d: number;
  missingDaysList: string[];
  lateArrivingDataCount: number;
  duplicateLoadCount: number;
  duplicateLoadPct: number;
  expectedAccounts: number;
  ingestedAccounts30d: number;
  coverageCompletenessPct: number;
  score: number;
}

export interface CostBasisCurrencyRow {
  currency: string;
  spend: number;
  spendPct: number;
}

export interface CostBasisDriftEvent {
  id: string;
  label: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export interface CostBasisConsistencySection {
  dominantCurrency: string;
  currencies: CostBasisCurrencyRow[];
  currencyConsistencyPct: number;
  amortizationModeConsistency: number;
  detectedModes: string[];
  creditsRefundConsistency: number;
  commitmentTreatmentConsistency: number;
  costBasisDriftEvents: CostBasisDriftEvent[];
}

export interface DenominatorQualitySection {
  denominatorCoveragePct: number;
  missingDenominatorSpend: number;
  missingDenominatorSpendPct: number;
  granularityAlignmentPct: number;
  granularityMismatchSpend: number;
  staleDenominatorCount: number;
  denominatorStalenessPct: number;
  trustGateStatus: "pass" | "flagged" | "blocked";
  score: number;
}

export interface KpiDictionaryRow {
  metric: string;
  definition: string;
  formula: string;
  thresholds: {
    green: string;
    amber: string;
    red: string;
  };
  granularity: string;
  owner: string;
}

export interface DriftSignalRow {
  metric: string;
  decayCondition: string;
  action: string;
}

export interface RootCausePathRow {
  riskId: string;
  title: string;
  level: RiskLevel;
  steps: string[];
}

export interface GovernanceModel {
  purpose: string;
  nonOverlap: string[];
  informationArchitecture?: {
    sections: string[];
    userFlow: string[];
  };
  overview: GovernanceOverview;
  tagMetadata: TagMetadataSection;
  ownershipAllocation: OwnershipAllocationSection;
  sharedPoolIntegrity: SharedPoolIntegritySection;
  policyCompliance: PolicyComplianceSection;
  ingestionReliability: IngestionReliabilitySection;
  costBasisConsistency: CostBasisConsistencySection;
  denominatorQuality: DenominatorQualitySection;
  formulas: Record<string, string>;
  kpiDictionary?: KpiDictionaryRow[];
  weightingModel?: {
    tagCompliance?: number;
    allocationConfidence?: number;
    sharedPoolHealth?: number;
    policyCompliance?: number;
    ingestionReliability?: number;
    costBasisConsistency?: number;
    denominatorCoverage?: number;
    hardGates?: string[];
  };
  driftSignals?: DriftSignalRow[];
  rootCausePaths?: RootCausePathRow[];
  views?: Record<string, string[]>;
  generatedAt: string;
  formulaVersion: string;
  currency: string;
}

export interface DataQualityStats {
  score: number;
  totalRows: number;
  costAtRisk: number;
  governance?: GovernanceModel | null;
  [key: string]: unknown;
}

export type GateStatus = "pass" | "warn" | "fail";
export type BannerSeverity = "critical" | "high" | "medium" | "low";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}

export interface UseDataQualityParams {
  filters?: Partial<DashboardFilters>;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface UseDataQualityResult {
  loading: boolean;
  stats: DataQualityStats | null;
}

export interface GovernanceFilters extends Partial<DashboardFilters> {
  dateRange?: string;
  environment?: string;
  team?: string;
  account?: string;
  owner?: string;
  currencyMode?: string;
  costBasisMode?: string;
  [key: string]: string | undefined;
}

export interface GateSummary {
  id: string;
  label: string;
  severity: GateStatus;
  message: string;
}

export interface QualityImpactBannerPayload {
  last_checked_ts: string;
  severity: BannerSeverity;
  confidence_level: ConfidenceLevel;
  recommended_owner: string;
  overall_status: GateStatus;
  message: string;
  active_gate_ids: string[];
  impact_scope_chips: string[];
  gate_summaries: GateSummary[];
  behavior?: {
    confidence_label_mode?: string;
  };
  ttl_seconds?: number;
}

export interface FreshnessSourceStatus {
  provider: string;
  source_id: string;
  last_success_ts: string | null;
  lag_hours: number | null;
  sla_soft_hours: number;
  sla_hard_hours: number;
  status: GateStatus;
}

export interface FreshnessStatusPayload {
  last_checked_ts: string;
  severity: GateStatus;
  confidence_level: ConfidenceLevel;
  recommended_owner: string;
  summary: {
    reliability_score: number;
    freshness_lag_hours: number | null;
    missing_days_30d: number;
    duplicate_load_pct: number;
  };
  sources: FreshnessSourceStatus[];
}

export interface CoverageGatesPayload {
  last_checked_ts: string;
  severity: GateStatus;
  confidence_level: ConfidenceLevel;
  recommended_owner: string;
  gates: {
    missing_accounts: { value: number; status: GateStatus };
    missing_days: { value: number; status: GateStatus };
    duplicates: { value: number; status: GateStatus };
    late_arriving: { value: number; status: GateStatus };
  };
  summary: {
    expected_accounts: number;
    ingested_accounts_30d: number;
    coverage_completeness_pct: number;
  };
  rows: {
    missing_days: string[];
  };
}

export interface TagCompliancePayload {
  last_checked_ts: string;
  severity: GateStatus;
  confidence_level: ConfidenceLevel;
  recommended_owner: string;
  spend_weighted_compliance_pct: number;
  missing_tag_spend: number;
  invalid_value_pct: number;
  matrix_rows: CoverageByKeyRow[];
  top_offenders: {
    services: TopMissingServiceRow[];
    accounts: TopMissingAccountRow[];
  };
}

export interface OwnershipCompletenessPayload {
  last_checked_ts: string;
  severity: GateStatus;
  confidence_level: ConfidenceLevel;
  recommended_owner: string;
  required_fields: string[];
  completeness_score_pct: number;
  unowned_spend: number;
  coverage: {
    allocated_pct: number;
    unallocated_pct: number;
    mapping_stability_pct: number;
  };
  drivers: Array<{ key: string; value: number }>;
}

export interface CurrencyBasisPayload {
  last_checked_ts: string;
  severity: GateStatus;
  confidence_level: ConfidenceLevel;
  recommended_owner: string;
  fx_health: {
    source_status: string;
    stale_hours: number | null;
    missing_pairs: number;
  };
  mismatch_spend_pct: number;
  basis_checks: {
    dominant_currency: string;
    amortization_mode_consistency: number;
    commitment_treatment_consistency: number;
    credits_refunds_consistency: number;
  };
  drift_events: CostBasisDriftEvent[];
}

export interface DenominatorQualityPayload {
  last_checked_ts: string;
  severity: GateStatus;
  confidence_level: ConfidenceLevel;
  recommended_owner: string;
  readiness_status: "pass" | "flagged" | "blocked" | string;
  availability_pct: number;
  mapping_completeness_pct: number;
  invalid_volume_pct: number;
  reason_codes: string[];
  affected_metric_keys: string[];
  impact?: {
    unit_economics_confidence?: ConfidenceLevel | string;
  };
}

export interface ControlViolationsPayload {
  last_checked_ts: string;
  severity: GateStatus;
  confidence_level: ConfidenceLevel;
  recommended_owner: string;
  summary: {
    violation_count: number;
    violated_spend: number;
    violated_spend_pct: number;
  };
  severity_summary: SeveritySummaryRow[];
  top_violating_teams: ViolatingOwnerRow[];
  top_violating_services: ViolatingServiceRow[];
  top_violating_accounts: ViolatingAccountRow[];
  policy_categories: string[];
}
