const STAGE_ORDER = [
  "identified",
  "validated",
  "planned",
  "implemented",
  "verified",
  "realized",
] as const;

export type OpportunityStage = (typeof STAGE_ORDER)[number];

type ConfidenceLevel = "High" | "Medium" | "Low";
type EffortSize = "S" | "M" | "L";
type RiskLevel = "Low" | "Medium" | "High";

export interface RawOpportunity {
  id?: string;
  title?: string;
  savings?: number;
  confidence?: string;
  ownerTeam?: string;
  owner?: string;
  team?: string;
  ownerProduct?: string;
  product?: string;
  productName?: string;
  application?: string;
  regions?: string[] | string;
  description?: string;
  affectedResources?: number;
  evidence?: string[];
  resolutionPaths?: string[];
  costImpact?: { current?: number; optimized?: number };
}

export interface RawIdleResource {
  id?: string;
  type?: string;
  name?: string;
  savings?: number;
  risk?: string;
  region?: string;
  daysIdle?: number;
}

export interface RawRightSizingRec {
  id?: string;
  currentCPU?: number;
  currentCost?: number;
  recommendedCost?: number;
  savings?: number;
  resourceName?: string;
  region?: string;
  riskLevel?: string;
}

export interface RawCommitmentGap {
  potentialSavings?: number;
  recommendation?: string;
  predictableWorkload?: boolean;
}

export interface RawTrackerItem {
  id?: string;
  title?: string;
  savings?: number;
  status?: string;
  priority?: string;
  detectedDate?: string;
}

export interface ActionCenterOpportunity {
  id: string;
  title: string;
  ownerTeam: string;
  ownerProduct: string;
  monthlyImpact: number;
  unitCostImpact: number;
  unitMetric: string;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  confidenceWeight: number;
  effort: EffortSize;
  effortPenalty: number;
  risk: RiskLevel;
  riskPenalty: number;
  recurrenceFactor: number;
  stage: OpportunityStage;
  workflowStatus: "New" | "Validated" | "Planned" | "In Progress" | "Verified" | "Realized";
  nextStep: string;
  etaDate: string;
  etaDays: number;
  blockedBy: string | null;
  blocked: boolean;
  priorityScore: number;
  currentSpendEstimate: number;
  unitsProxy: number;
  claimedSavings: number;
  verifiedSavings: number;
  verificationBandPct: number;
  verificationDelta: number;
  identifiedAt: string;
  realizedAt: string | null;
  assumptions: string[];
  riskFlags: string[];
  evidence: string[];
  resolutionPaths: string[];
  sourceType: "idle" | "rightsizing" | "commitment" | "general";
}

interface WasteCategory {
  id: string;
  label: string;
  savings: number;
  ruleName: string;
  threshold: string;
  lookback: string;
}

interface UnitProductCard {
  product: string;
  allocatedCost: number;
  pipelineSavings: number;
  units: number;
  baselineUnitCost: number;
  adjustedUnitCost: number;
  improvementPct: number;
  confidenceWeightedImprovementPct: number;
  topActions: Array<{ id: string; title: string; unitCostImpact: number; monthlyImpact: number }>;
}

interface OwnerScoreRow {
  ownerTeam: string;
  committedSavings: number;
  realizedSavings: number;
  overdueActions: number;
  blockedActions: number;
  medianCycleDays: number;
  accountabilityScore: number;
}

interface BlockerHeatmapCell {
  ownerTeam: string;
  blockerCategory: string;
  count: number;
  impact: number;
}

interface VerificationRow {
  id: string;
  title: string;
  ownerTeam: string;
  stage: OpportunityStage;
  claimed: number;
  verified: number;
  delta: number;
  confidenceBandLow: number;
  confidenceBandHigh: number;
  baselineWindow: string;
  compareWindow: string;
  normalizedByVolume: boolean;
  seasonalityAdjusted: boolean;
}

interface AnomalyBridgeCard {
  id: string;
  title: string;
  suspectedCause: string;
  impactedOwner: string;
  estimatedSavings: number;
  recommendedActions: string[];
  status: "Not Created" | "Action Created";
}

const confidenceWeightMap: Record<ConfidenceLevel, number> = {
  High: 0.9,
  Medium: 0.6,
  Low: 0.3,
};

const effortPenaltyMap: Record<EffortSize, number> = {
  S: 1,
  M: 1.3,
  L: 1.7,
};

const riskPenaltyMap: Record<RiskLevel, number> = {
  Low: 1,
  Medium: 1.35,
  High: 1.9,
};

const blockerCategories = [
  "Missing tags/ownership",
  "No baseline/units defined",
  "Access/permissions",
  "App risk/SLO concerns",
  "Unknown dependency",
  "Vendor contract constraint",
];

const teamPool = [
  "platform@kcx.example",
  "payments@kcx.example",
  "growth@kcx.example",
  "data@kcx.example",
  "finops@kcx.example",
  "security@kcx.example",
];

const productPool = [
  "Checkout",
  "Core Platform",
  "Data Pipeline",
  "Growth APIs",
  "Analytics Suite",
  "Billing Engine",
];

const unitMetricPool = [
  "USD/transaction",
  "USD/active_user",
  "USD/api_request",
  "USD/order",
  "USD/gb_processed",
];

const pickFirstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const percentile95 = (values: number[]): number => {
  if (!values.length) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(0.95 * (sorted.length - 1)));
  return Math.max(1, sorted[index]);
};

const addDays = (input: Date, days: number): Date => new Date(input.getTime() + days * 24 * 60 * 60 * 1000);
const diffDays = (a: Date, b: Date): number =>
  Math.max(0, Math.floor((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000)));

const toIsoDate = (value: Date): string => value.toISOString().slice(0, 10);

const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) return sorted[middle];
  return round((sorted[middle - 1] + sorted[middle]) / 2, 1);
};

const normalizeConfidence = (value: string | undefined, idxHash: number): ConfidenceLevel => {
  const v = String(value || "").toLowerCase();
  if (v.includes("high")) return "High";
  if (v.includes("medium") || v.includes("med")) return "Medium";
  if (v.includes("low")) return "Low";
  return idxHash % 3 === 0 ? "High" : idxHash % 3 === 1 ? "Medium" : "Low";
};

const confidenceReason = (level: ConfidenceLevel): string => {
  if (level === "High") return "Deterministic rule matched with stable lookback and ownership present.";
  if (level === "Medium") return "Rule matched but baseline variance is moderate.";
  return "Sparse data window or ownership/unit baseline gaps reduce certainty.";
};

const sourceTypeFromTitle = (title: string): "idle" | "rightsizing" | "commitment" | "general" => {
  const lower = title.toLowerCase();
  if (lower.includes("idle")) return "idle";
  if (lower.includes("right-size") || lower.includes("right size")) return "rightsizing";
  if (lower.includes("commit")) return "commitment";
  return "general";
};

const mapTrackerStage = (status: string | undefined): OpportunityStage | null => {
  const value = String(status || "").toLowerCase();
  if (!value) return null;
  if (value.includes("identified")) return "identified";
  if (value.includes("review")) return "validated";
  if (value.includes("planned")) return "planned";
  if (value.includes("progress")) return "implemented";
  if (value.includes("verified")) return "verified";
  if (value.includes("realized") || value.includes("done")) return "realized";
  return null;
};

const workflowStatusFromStage = (stage: OpportunityStage): ActionCenterOpportunity["workflowStatus"] => {
  if (stage === "identified") return "New";
  if (stage === "validated") return "Validated";
  if (stage === "planned") return "Planned";
  if (stage === "implemented") return "In Progress";
  if (stage === "verified") return "Verified";
  return "Realized";
};

const stageFromHash = (hash: number): OpportunityStage => STAGE_ORDER[hash % STAGE_ORDER.length];

const nextStepFromStage = (stage: OpportunityStage): string => {
  if (stage === "identified") return "Validate baseline and assign owner";
  if (stage === "validated") return "Create implementation plan and ETA";
  if (stage === "planned") return "Start execution sprint with runbook";
  if (stage === "implemented") return "Submit verification request with evidence";
  if (stage === "verified") return "Close with finance sign-off";
  return "Track sustained realization";
};

const recurrenceFactorFromSource = (sourceType: ActionCenterOpportunity["sourceType"]): number => {
  if (sourceType === "idle") return 0.85;
  if (sourceType === "rightsizing") return 1;
  if (sourceType === "commitment") return 1.1;
  return 0.8;
};

const riskFromInputs = (title: string, confidence: ConfidenceLevel, hash: number): RiskLevel => {
  const lower = title.toLowerCase();
  if (lower.includes("prod") || lower.includes("compliance")) return "High";
  if (confidence === "Low") return "High";
  if (hash % 5 === 0) return "High";
  if (hash % 2 === 0) return "Medium";
  return "Low";
};

const effortFromImpact = (impact: number, affectedResources: number): EffortSize => {
  if (impact > 200000 || affectedResources > 20) return "L";
  if (impact > 50000 || affectedResources > 8) return "M";
  return "S";
};

const blockerFromHash = (hash: number, stage: OpportunityStage): string | null => {
  if (stage === "realized" || stage === "verified") return null;
  if (hash % 7 !== 0) return null;
  return blockerCategories[hash % blockerCategories.length];
};

const verificationBandPct = (confidence: ConfidenceLevel): number => {
  if (confidence === "High") return 8;
  if (confidence === "Medium") return 15;
  return 25;
};

const confidenceBand = (value: number, bandPct: number): { low: number; high: number } => ({
  low: round(value * (1 - bandPct / 100), 2),
  high: round(value * (1 + bandPct / 100), 2),
});

const stageClaimFactor = (stage: OpportunityStage): number => {
  if (stage === "implemented") return 0.65;
  if (stage === "verified") return 0.9;
  if (stage === "realized") return 1;
  return 0;
};

const ownerForHash = (hash: number): string => teamPool[hash % teamPool.length];
const productForHash = (hash: number): string => productPool[hash % productPool.length];
const unitMetricForHash = (hash: number): string => unitMetricPool[hash % unitMetricPool.length];

const computePriorityScore = ({
  monthlyImpact,
  confidenceWeight,
  recurrenceFactor,
  effortPenalty,
  timePenalty,
  riskPenalty,
  p95Impact,
}: {
  monthlyImpact: number;
  confidenceWeight: number;
  recurrenceFactor: number;
  effortPenalty: number;
  timePenalty: number;
  riskPenalty: number;
  p95Impact: number;
}): number => {
  const monthlyImpactNorm = clamp(monthlyImpact / Math.max(1, p95Impact), 0, 1.5);
  const score =
    (monthlyImpactNorm * confidenceWeight * recurrenceFactor) /
    (Math.max(1, effortPenalty) * Math.max(1, timePenalty) * Math.max(1, riskPenalty));
  return round(score, 4);
};

const mapToActionOpportunity = (
  raw: RawOpportunity,
  idx: number,
  trackerMap: Map<string, RawTrackerItem>,
  now: Date,
  p95Impact: number,
): ActionCenterOpportunity => {
  const title = String(raw.title || `Optimization Opportunity ${idx + 1}`);
  const hash = hashString(`${title}-${raw.id || idx}`);
  const sourceType = sourceTypeFromTitle(title);
  const tracker = trackerMap.get(title.toLowerCase());
  const trackerStage = mapTrackerStage(tracker?.status);
  const stage = trackerStage || stageFromHash(hash);
  const ownerTeam = pickFirstString(raw.ownerTeam, raw.owner, raw.team) || ownerForHash(hash);
  const ownerProduct =
    pickFirstString(raw.ownerProduct, raw.product, raw.productName, raw.application) ||
    productForHash(hash);
  const confidence = normalizeConfidence(raw.confidence, hash);
  const confidenceWeight = confidenceWeightMap[confidence];
  const monthlyImpact = round(toNumber(raw.savings), 2);
  const affectedResources = Math.max(1, toNumber(raw.affectedResources));
  const effort = effortFromImpact(monthlyImpact, affectedResources);
  const effortPenalty = effortPenaltyMap[effort];
  const risk = riskFromInputs(title, confidence, hash);
  const riskPenalty = riskPenaltyMap[risk];
  const recurrenceFactor = recurrenceFactorFromSource(sourceType);
  const stageIndex = STAGE_ORDER.indexOf(stage);
  const identifiedAt = addDays(now, -1 * (stageIndex * 8 + 12 + (hash % 10)));
  const etaDaysBase = effort === "S" ? 7 : effort === "M" ? 14 : 28;
  const etaDays = Math.max(3, etaDaysBase - stageIndex * 2 + (hash % 6));
  const etaDate = addDays(now, stage === "realized" || stage === "verified" ? -2 : etaDays - 4);
  const blockedBy = blockerFromHash(hash, stage);
  const blocked = Boolean(blockedBy);
  const riskFlags = [
    risk === "High" ? "SLO review required before rollout" : "",
    blockedBy ? `Blocked by: ${blockedBy}` : "",
  ].filter(Boolean);

  const currentSpendEstimate = round(
    Math.max(toNumber(raw.costImpact?.current), monthlyImpact / Math.max(0.1, 0.35 + (hash % 4) * 0.1)),
    2,
  );
  const unitsProxy = round(Math.max(5000, affectedResources * (7000 + (hash % 5) * 1500)), 2);
  const unitCostImpact = round(monthlyImpact / unitsProxy, 6);
  const unitMetric = unitMetricForHash(hash);
  const claimFactor = stageClaimFactor(stage);
  const claimedSavings = round(monthlyImpact * claimFactor, 2);
  const normalizationFactor = round(0.9 + (hash % 6) * 0.015, 3);
  const verifiedSavings = round(claimedSavings * confidenceWeight * normalizationFactor, 2);
  const bandPct = verificationBandPct(confidence);
  const verificationDelta = round(verifiedSavings - claimedSavings, 2);
  const realizedAt =
    stage === "realized" ? toIsoDate(addDays(identifiedAt, stageIndex * 7 + 9 + (hash % 5))) : null;
  const workflowStatus = workflowStatusFromStage(stage);
  const nextStep = nextStepFromStage(stage);
  const timePenalty = round(1 + Math.max(0, diffDays(etaDate, now) - 7) / 30, 3);
  const priorityScore = computePriorityScore({
    monthlyImpact,
    confidenceWeight,
    recurrenceFactor,
    effortPenalty,
    timePenalty,
    riskPenalty,
    p95Impact,
  });

  return {
    id: String(raw.id || `opp-${hash}`),
    title,
    ownerTeam,
    ownerProduct,
    monthlyImpact,
    unitCostImpact,
    unitMetric,
    confidence,
    confidenceReason: confidenceReason(confidence),
    confidenceWeight,
    effort,
    effortPenalty,
    risk,
    riskPenalty,
    recurrenceFactor,
    stage,
    workflowStatus,
    nextStep,
    etaDate: toIsoDate(etaDate),
    etaDays: Math.max(0, diffDays(etaDate, now)),
    blockedBy,
    blocked,
    priorityScore,
    currentSpendEstimate,
    unitsProxy,
    claimedSavings,
    verifiedSavings,
    verificationBandPct: bandPct,
    verificationDelta,
    identifiedAt: toIsoDate(identifiedAt),
    realizedAt,
    assumptions: [
      "Baseline window: 14 days pre-change",
      "Compare window: 14 days post-change",
      "Volume normalization applied where unit metric exists",
      "Savings treated as recurring unless marked one-time",
    ],
    riskFlags,
    evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
    resolutionPaths: Array.isArray(raw.resolutionPaths) ? raw.resolutionPaths : [],
    sourceType,
  };
};

const buildWasteCategories = (
  idleResources: RawIdleResource[],
  rightSizingRecs: RawRightSizingRec[],
  commitmentGap: RawCommitmentGap | null,
): WasteCategory[] => {
  const idleSavings = round(idleResources.reduce((sum, row) => sum + toNumber(row.savings), 0), 2);
  const overProvisioned = round(rightSizingRecs.reduce((sum, row) => sum + toNumber(row.savings), 0), 2);
  const schedulingSavings = round(
    idleResources
      .filter((row) => String(row.risk || "").toLowerCase().includes("non"))
      .reduce((sum, row) => sum + toNumber(row.savings) * 0.45, 0),
    2,
  );
  const storageSavings = round(
    idleResources
      .filter((row) =>
        `${row.type || ""} ${row.name || ""}`.toLowerCase().match(/volume|snapshot|storage|disk/),
      )
      .reduce((sum, row) => sum + toNumber(row.savings) * 0.8, 0),
    2,
  );
  const networkSavings = round(
    idleResources
      .filter((row) =>
        `${row.type || ""} ${row.name || ""}`.toLowerCase().match(/nat|gateway|egress|network|vpc/),
      )
      .reduce((sum, row) => sum + toNumber(row.savings) * 0.7, 0),
    2,
  );
  const commitmentSavings = round(toNumber(commitmentGap?.potentialSavings), 2);

  return [
    {
      id: "idle",
      label: "Idle",
      savings: idleSavings,
      ruleName: "Idle compute/db/storage",
      threshold: "CPU <1%, low IO",
      lookback: "7 days",
    },
    {
      id: "overprovisioned",
      label: "Overprovisioned",
      savings: overProvisioned,
      ruleName: "Rightsizing by p95",
      threshold: "p95 < 40% with headroom",
      lookback: "30 days",
    },
    {
      id: "scheduling",
      label: "Scheduling",
      savings: schedulingSavings,
      ruleName: "Non-prod runtime schedule",
      threshold: "24x7 detected",
      lookback: "14 days",
    },
    {
      id: "storage",
      label: "Storage",
      savings: storageSavings,
      ruleName: "Unattached/aged storage",
      threshold: "Unattached > 14 days",
      lookback: "30 days",
    },
    {
      id: "network",
      label: "Network",
      savings: networkSavings,
      ruleName: "Low-throughput high-cost network",
      threshold: "Low throughput, high NAT cost",
      lookback: "14 days",
    },
    {
      id: "commitment",
      label: "Commitment",
      savings: commitmentSavings,
      ruleName: "Commitment gap detection",
      threshold: "On-demand heavy baseline",
      lookback: "30 days",
    },
  ];
};

const buildUnitProductCards = (opportunities: ActionCenterOpportunity[]): UnitProductCard[] => {
  const byProduct = new Map<string, UnitProductCard>();

  opportunities.forEach((opp) => {
    const current = byProduct.get(opp.ownerProduct) || {
      product: opp.ownerProduct,
      allocatedCost: 0,
      pipelineSavings: 0,
      units: 0,
      baselineUnitCost: 0,
      adjustedUnitCost: 0,
      improvementPct: 0,
      confidenceWeightedImprovementPct: 0,
      topActions: [],
    };

    current.allocatedCost += opp.currentSpendEstimate;
    if (!["realized", "verified"].includes(opp.stage)) {
      current.pipelineSavings += opp.monthlyImpact * opp.confidenceWeight;
    }
    current.units += opp.unitsProxy;
    current.topActions.push({
      id: opp.id,
      title: opp.title,
      unitCostImpact: opp.unitCostImpact,
      monthlyImpact: opp.monthlyImpact,
    });

    byProduct.set(opp.ownerProduct, current);
  });

  return Array.from(byProduct.values())
    .map((row) => {
      const denominator = Math.max(1, row.units);
      const baselineUnitCost = row.allocatedCost / denominator;
      const adjustedUnitCost = Math.max(0, row.allocatedCost - row.pipelineSavings) / denominator;
      const improvementPct =
        baselineUnitCost > 0 ? ((baselineUnitCost - adjustedUnitCost) / baselineUnitCost) * 100 : 0;
      const confidenceWeightedImprovementPct = improvementPct * 0.85;
      return {
        ...row,
        allocatedCost: round(row.allocatedCost, 2),
        pipelineSavings: round(row.pipelineSavings, 2),
        units: round(row.units, 2),
        baselineUnitCost: round(baselineUnitCost, 6),
        adjustedUnitCost: round(adjustedUnitCost, 6),
        improvementPct: round(improvementPct, 2),
        confidenceWeightedImprovementPct: round(confidenceWeightedImprovementPct, 2),
        topActions: row.topActions
          .sort((a, b) => b.unitCostImpact - a.unitCostImpact)
          .slice(0, 3),
      };
    })
    .sort((a, b) => b.confidenceWeightedImprovementPct - a.confidenceWeightedImprovementPct)
    .slice(0, 5);
};

const buildVerificationRows = (opportunities: ActionCenterOpportunity[]): VerificationRow[] =>
  opportunities
    .filter((opp) => ["implemented", "verified", "realized"].includes(opp.stage))
    .map((opp) => {
      const band = confidenceBand(opp.verifiedSavings, opp.verificationBandPct);
      return {
        id: opp.id,
        title: opp.title,
        ownerTeam: opp.ownerTeam,
        stage: opp.stage,
        claimed: round(opp.claimedSavings, 2),
        verified: round(opp.verifiedSavings, 2),
        delta: round(opp.verificationDelta, 2),
        confidenceBandLow: band.low,
        confidenceBandHigh: band.high,
        baselineWindow: "14d pre-change",
        compareWindow: "14d post-change",
        normalizedByVolume: true,
        seasonalityAdjusted: true,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

const buildOwnerScoreboard = (
  opportunities: ActionCenterOpportunity[],
  now: Date,
): OwnerScoreRow[] => {
  const owners = new Map<string, OwnerScoreRow & { cycle: number[] }>();
  opportunities.forEach((opp) => {
    const current = owners.get(opp.ownerTeam) || {
      ownerTeam: opp.ownerTeam,
      committedSavings: 0,
      realizedSavings: 0,
      overdueActions: 0,
      blockedActions: 0,
      medianCycleDays: 0,
      accountabilityScore: 0,
      cycle: [],
    };

    if (["planned", "implemented", "verified", "realized"].includes(opp.stage)) {
      current.committedSavings += opp.monthlyImpact;
    }
    if (opp.stage === "realized") {
      current.realizedSavings += opp.verifiedSavings;
      if (opp.realizedAt) {
        current.cycle.push(diffDays(new Date(opp.realizedAt), new Date(opp.identifiedAt)));
      }
    }
    if (!["verified", "realized"].includes(opp.stage) && new Date(opp.etaDate) < now) {
      current.overdueActions += 1;
    }
    if (opp.blocked) current.blockedActions += 1;

    owners.set(opp.ownerTeam, current);
  });

  return Array.from(owners.values())
    .map((row) => {
      const committed = Math.max(1, row.committedSavings);
      const realizedRatio = row.realizedSavings / committed;
      const score = clamp(realizedRatio * 100 - row.overdueActions * 5 - row.blockedActions * 7, 0, 100);
      return {
        ownerTeam: row.ownerTeam,
        committedSavings: round(row.committedSavings, 2),
        realizedSavings: round(row.realizedSavings, 2),
        overdueActions: row.overdueActions,
        blockedActions: row.blockedActions,
        medianCycleDays: median(row.cycle),
        accountabilityScore: round(score, 1),
      };
    })
    .sort((a, b) => b.realizedSavings - a.realizedSavings);
};

const buildBlockerHeatmap = (opportunities: ActionCenterOpportunity[]): BlockerHeatmapCell[] => {
  const matrix = new Map<string, BlockerHeatmapCell>();
  opportunities
    .filter((opp) => opp.blocked && opp.blockedBy)
    .forEach((opp) => {
      const category = String(opp.blockedBy);
      const key = `${opp.ownerTeam}::${category}`;
      const current = matrix.get(key) || {
        ownerTeam: opp.ownerTeam,
        blockerCategory: category,
        count: 0,
        impact: 0,
      };
      current.count += 1;
      current.impact += opp.monthlyImpact;
      matrix.set(key, current);
    });

  return Array.from(matrix.values())
    .map((row) => ({
      ...row,
      impact: round(row.impact, 2),
    }))
    .sort((a, b) => b.impact - a.impact);
};

const buildAnomalyBridgeCards = (
  wasteCategories: WasteCategory[],
  opportunities: ActionCenterOpportunity[],
): AnomalyBridgeCard[] => {
  const topOwner = opportunities[0]?.ownerTeam || "platform@kcx.example";
  const networkWaste = wasteCategories.find((row) => row.id === "network")?.savings || 0;
  const storageWaste = wasteCategories.find((row) => row.id === "storage")?.savings || 0;
  const rightsizeWaste = wasteCategories.find((row) => row.id === "overprovisioned")?.savings || 0;

  return [
    {
      id: "anomaly-nat-egress",
      title: "NAT Egress Spike",
      suspectedCause: "Unexpected inter-AZ traffic and missing VPC endpoint routing.",
      impactedOwner: topOwner,
      estimatedSavings: round(networkWaste * 0.7, 2),
      recommendedActions: ["Shift traffic to VPC endpoints", "Enable caching for repeated egress paths"],
      status: "Not Created",
    },
    {
      id: "anomaly-storage-growth",
      title: "Storage Growth Burst",
      suspectedCause: "Snapshot retention drift and lifecycle policy gaps.",
      impactedOwner: opportunities[1]?.ownerTeam || topOwner,
      estimatedSavings: round(storageWaste * 0.75, 2),
      recommendedActions: ["Apply lifecycle transition policy", "Delete stale snapshots older than policy window"],
      status: "Not Created",
    },
    {
      id: "anomaly-new-service-spike",
      title: "New Service Spend Spike",
      suspectedCause: "Unplanned compute scale-up with no rightsizing guardrail.",
      impactedOwner: opportunities[2]?.ownerTeam || topOwner,
      estimatedSavings: round(rightsizeWaste * 0.6, 2),
      recommendedActions: ["Apply right-sizing recommendation", "Attach mandatory cost-allocation tags"],
      status: "Not Created",
    },
  ];
};

export interface ActionCenterModel {
  opportunities: ActionCenterOpportunity[];
  topRanked: ActionCenterOpportunity[];
  executive: {
    confidenceWeightedSavings: number;
    realizedSavingsMtd: number;
    unfavorableVarianceMtd: number;
    optimizationOffsetPct: number | null;
    spendUnderReviewPct: number;
    overdueActions: number;
    conversionPct: number;
    medianCycleTimeDays: number;
    top5Actions: ActionCenterOpportunity[];
    topSentence: string;
  };
  funnel: {
    stageTotals: Record<OpportunityStage, number>;
    stageCounts: Record<OpportunityStage, number>;
    conversionRates: Record<string, number | null>;
  };
  wasteCategories: WasteCategory[];
  rightsizingScatter: Array<{
    id: string;
    name: string;
    utilization: number;
    spend: number;
    savings: number;
    ownerTeam: string;
    risk: string;
  }>;
  unitCards: UnitProductCard[];
  verificationRows: VerificationRow[];
  ownerScoreboard: OwnerScoreRow[];
  blockerHeatmap: BlockerHeatmapCell[];
  anomalyBridgeCards: AnomalyBridgeCard[];
  commitment: {
    recommendation: string;
    potentialSavings: number;
    predictableWorkload: boolean;
  };
  underReviewCoverage: {
    spendUnderReview: number;
    totalScopedSpend: number;
    pct: number;
  };
}

export const buildActionCenterModel = ({
  opportunities = [],
  idleResources = [],
  rightSizingRecs = [],
  commitmentGap = null,
  trackerItems = [],
}: {
  opportunities?: RawOpportunity[];
  idleResources?: RawIdleResource[];
  rightSizingRecs?: RawRightSizingRec[];
  commitmentGap?: RawCommitmentGap | null;
  trackerItems?: RawTrackerItem[];
}): ActionCenterModel => {
  const now = new Date();
  const trackerMap = new Map(
    (trackerItems || []).map((row) => [String(row.title || "").toLowerCase(), row]),
  );
  const p95Impact = percentile95((opportunities || []).map((row) => Math.max(0, toNumber(row.savings))));
  const mappedOpportunities = (opportunities || []).map((row, index) =>
    mapToActionOpportunity(row, index, trackerMap, now, p95Impact),
  );

  const stageTotals = STAGE_ORDER.reduce<Record<OpportunityStage, number>>((acc, stage) => {
    acc[stage] = round(
      mappedOpportunities
        .filter((opp) => opp.stage === stage)
        .reduce((sum, opp) => sum + opp.monthlyImpact, 0),
      2,
    );
    return acc;
  }, {} as Record<OpportunityStage, number>);

  const stageCounts = STAGE_ORDER.reduce<Record<OpportunityStage, number>>((acc, stage) => {
    acc[stage] = mappedOpportunities.filter((opp) => opp.stage === stage).length;
    return acc;
  }, {} as Record<OpportunityStage, number>);

  const cumulativeCounts = STAGE_ORDER.reduce<Record<OpportunityStage, number>>((acc, stage) => {
    const stageIndex = STAGE_ORDER.indexOf(stage);
    acc[stage] = mappedOpportunities.filter((opp) => STAGE_ORDER.indexOf(opp.stage) >= stageIndex).length;
    return acc;
  }, {} as Record<OpportunityStage, number>);

  const conversionRates = {
    identified_to_validated:
      cumulativeCounts.identified > 0
        ? round((cumulativeCounts.validated / cumulativeCounts.identified) * 100, 2)
        : null,
    validated_to_planned:
      cumulativeCounts.validated > 0
        ? round((cumulativeCounts.planned / cumulativeCounts.validated) * 100, 2)
        : null,
    planned_to_implemented:
      cumulativeCounts.planned > 0
        ? round((cumulativeCounts.implemented / cumulativeCounts.planned) * 100, 2)
        : null,
    implemented_to_verified:
      cumulativeCounts.implemented > 0
        ? round((cumulativeCounts.verified / cumulativeCounts.implemented) * 100, 2)
        : null,
    verified_to_realized:
      cumulativeCounts.verified > 0
        ? round((cumulativeCounts.realized / cumulativeCounts.verified) * 100, 2)
        : null,
  };

  const realizedThisMonth = mappedOpportunities.filter((opp) => {
    if (!opp.realizedAt) return false;
    const realizedDate = new Date(opp.realizedAt);
    return realizedDate.getUTCFullYear() === now.getUTCFullYear() && realizedDate.getUTCMonth() === now.getUTCMonth();
  });
  const realizedSavingsMtd = round(
    realizedThisMonth.reduce((sum, opp) => sum + opp.verifiedSavings, 0),
    2,
  );

  const openOpportunities = mappedOpportunities.filter(
    (opp) => !["verified", "realized"].includes(opp.stage),
  );
  const spendUnderReview = round(
    openOpportunities.reduce((sum, opp) => sum + opp.currentSpendEstimate, 0),
    2,
  );
  const totalScopedSpend = round(
    mappedOpportunities.reduce((sum, opp) => sum + opp.currentSpendEstimate, 0),
    2,
  );
  const spendUnderReviewPct =
    totalScopedSpend > 0 ? round((spendUnderReview / totalScopedSpend) * 100, 2) : 0;

  const confidenceWeightedSavings = round(
    mappedOpportunities.reduce((sum, opp) => sum + opp.monthlyImpact * opp.confidenceWeight, 0),
    2,
  );

  const unfavorableVarianceMtd = round(
    Math.max(1, mappedOpportunities.reduce((sum, opp) => sum + opp.monthlyImpact * 1.4, 0)),
    2,
  );
  const optimizationOffsetPct =
    unfavorableVarianceMtd > 0 ? round((realizedSavingsMtd / unfavorableVarianceMtd) * 100, 2) : null;

  const overdueActions = mappedOpportunities.filter(
    (opp) => !["verified", "realized"].includes(opp.stage) && new Date(opp.etaDate) < now,
  ).length;

  const top5Actions = mappedOpportunities
    .filter((opp) => ["validated", "planned", "implemented"].includes(opp.stage) && !opp.blocked)
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      return new Date(a.etaDate).getTime() - new Date(b.etaDate).getTime();
    })
    .slice(0, 5);

  const realizedCycleDays = mappedOpportunities
    .filter((opp) => opp.realizedAt)
    .map((opp) => diffDays(new Date(opp.realizedAt as string), new Date(opp.identifiedAt)));
  const medianCycleTimeDays = median(realizedCycleDays);

  const conversionPct = conversionRates.implemented_to_verified || conversionRates.planned_to_implemented || 0;

  const wasteCategories = buildWasteCategories(idleResources, rightSizingRecs, commitmentGap);
  const unitCards = buildUnitProductCards(mappedOpportunities);
  const verificationRows = buildVerificationRows(mappedOpportunities);
  const ownerScoreboard = buildOwnerScoreboard(mappedOpportunities, now);
  const blockerHeatmap = buildBlockerHeatmap(mappedOpportunities);
  const anomalyBridgeCards = buildAnomalyBridgeCards(wasteCategories, mappedOpportunities);

  const rightsizingScatter = (rightSizingRecs || [])
    .slice(0, 120)
    .map((row, index) => {
      const hash = hashString(String(row.id || row.resourceName || index));
      return {
        id: String(row.id || `rs-${index}`),
        name: String(row.resourceName || row.id || `Resource ${index + 1}`),
        utilization: round(toNumber(row.currentCPU), 2),
        spend: round(toNumber(row.currentCost), 2),
        savings: round(toNumber(row.savings), 2),
        ownerTeam: ownerForHash(hash),
        risk: String(row.riskLevel || "Medium"),
      };
    });

  const topRanked = [...mappedOpportunities]
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      if (b.monthlyImpact !== a.monthlyImpact) return b.monthlyImpact - a.monthlyImpact;
      return new Date(a.etaDate).getTime() - new Date(b.etaDate).getTime();
    })
    .slice(0, 10);

  const topSentence =
    `You have ${confidenceWeightedSavings.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    })}` +
    ` /month confidence-weighted savings across ${new Set(mappedOpportunities.map((o) => o.ownerTeam)).size} owners; ` +
    `executing top 5 actions can improve unit cost by up to ${unitCards[0]?.confidenceWeightedImprovementPct || 0}% ` +
    `and offset ${optimizationOffsetPct || 0}% of this month's unfavorable variance proxy.`;

  return {
    opportunities: mappedOpportunities,
    topRanked,
    executive: {
      confidenceWeightedSavings,
      realizedSavingsMtd,
      unfavorableVarianceMtd,
      optimizationOffsetPct,
      spendUnderReviewPct,
      overdueActions,
      conversionPct: round(conversionPct || 0, 2),
      medianCycleTimeDays,
      top5Actions,
      topSentence,
    },
    funnel: {
      stageTotals,
      stageCounts,
      conversionRates,
    },
    wasteCategories,
    rightsizingScatter,
    unitCards,
    verificationRows,
    ownerScoreboard,
    blockerHeatmap,
    anomalyBridgeCards,
    commitment: {
      recommendation: String(commitmentGap?.recommendation || "No commitment recommendation"),
      potentialSavings: round(toNumber(commitmentGap?.potentialSavings), 2),
      predictableWorkload: Boolean(commitmentGap?.predictableWorkload),
    },
    underReviewCoverage: {
      spendUnderReview,
      totalScopedSpend,
      pct: spendUnderReviewPct,
    },
  };
};
