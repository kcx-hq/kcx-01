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
