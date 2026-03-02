import type {
  ConfidenceLevel,
  CurrencyBasisPayload,
  OwnershipCompletenessPayload,
  TagCompliancePayload,
} from "../../types";
import { formatPercent } from "../../utils/governance.format";

export type SectionView = "governance" | "data-quality";
export type InsightTone = "good" | "watch" | "risk";

export interface InsightCardModel {
  title: string;
  value: string;
  detail: string;
  owner: string;
  tone: InsightTone;
}

export interface ActionItem {
  title: string;
  detail: string;
  owner: string;
  priority: "P1" | "P2" | "P3";
}

const toTone = (status?: string): InsightTone => {
  if (status === "fail") return "risk";
  if (status === "warn") return "watch";
  return "good";
};

export const confidenceLabel = (level?: ConfidenceLevel | string): string => {
  const value = String(level || "").toLowerCase();
  if (value === "high") return "High";
  if (value === "medium") return "Medium";
  return "Low";
};

export const toneClasses: Record<InsightTone, string> = {
  good: "border-emerald-200 bg-emerald-50/70",
  watch: "border-amber-200 bg-amber-50/70",
  risk: "border-rose-200 bg-rose-50/70",
};

export const buildDataQualityInsights = ({
  freshnessLagHours,
  freshnessSeverity,
  reliabilityScore,
  coverageCompleteness,
  coverageSeverity,
  duplicatesPct,
  duplicateSeverity,
  denominatorAvailability,
  denominatorSeverity,
}: {
  freshnessLagHours: number | null | undefined;
  freshnessSeverity?: string;
  reliabilityScore: number;
  coverageCompleteness: number;
  coverageSeverity?: string;
  duplicatesPct: number;
  duplicateSeverity?: string;
  denominatorAvailability: number;
  denominatorSeverity: string;
}): InsightCardModel[] => [
  {
    title: "Pipeline Freshness",
    value: `${Number(freshnessLagHours || 0).toFixed(2)}h lag`,
    detail:
      toTone(freshnessSeverity) === "risk"
        ? "Data is stale for decisions."
        : toTone(freshnessSeverity) === "watch"
          ? "Freshness needs attention."
          : "Freshness is within target.",
    owner: "Data Engineering",
    tone: toTone(freshnessSeverity),
  },
  {
    title: "Ingestion Reliability",
    value: `${reliabilityScore.toFixed(2)} / 100`,
    detail:
      toTone(freshnessSeverity) === "risk"
        ? "Reliability is weak. Fix pipeline issues."
        : toTone(freshnessSeverity) === "watch"
          ? "Moderate reliability. Monitor drift."
          : "Reliability is strong.",
    owner: "Data Engineering",
    tone: toTone(freshnessSeverity),
  },
  {
    title: "Coverage Completeness",
    value: formatPercent(coverageCompleteness),
    detail:
      toTone(coverageSeverity) === "risk"
        ? "Coverage gap may skew baselines."
        : toTone(coverageSeverity) === "watch"
          ? "Minor completeness drift."
          : "Coverage is stable.",
    owner: "FinOps Platform",
    tone: toTone(coverageSeverity),
  },
  {
    title: "Duplicate Load Risk",
    value: formatPercent(duplicatesPct),
    detail:
      toTone(duplicateSeverity) === "risk"
        ? "Duplicates may overstate spend."
        : toTone(duplicateSeverity) === "watch"
          ? "Minor duplicates detected."
          : "No duplicate load detected.",
    owner: "Data Engineering",
    tone: toTone(duplicateSeverity),
  },
  {
    title: "Denominator Readiness",
    value: formatPercent(denominatorAvailability),
    detail:
      denominatorSeverity === "fail"
        ? "Denominator gate is blocked."
        : denominatorSeverity === "warn"
          ? "Denominator quality is partial."
          : "Denominator is ready.",
    owner: "Product Analytics",
    tone: toTone(denominatorSeverity),
  },
];

export const buildGovernanceInsights = ({
  tagCompliance,
  ownership,
  currencyBasis,
  violationPct,
  violationCount,
  violationsSeverity,
  governanceConfidence,
}: {
  tagCompliance: TagCompliancePayload | null;
  ownership: OwnershipCompletenessPayload | null;
  currencyBasis: CurrencyBasisPayload | null;
  violationPct: number;
  violationCount: number;
  violationsSeverity?: string;
  governanceConfidence: ConfidenceLevel | string | undefined;
}): InsightCardModel[] => [
  {
    title: "Tag Policy Compliance",
    value: formatPercent(tagCompliance?.spend_weighted_compliance_pct || 0),
    detail: (tagCompliance?.spend_weighted_compliance_pct || 0) < 90 ? "Tag debt is impacting allocation." : "Tag coverage is healthy.",
    owner: tagCompliance?.recommended_owner || "FinOps",
    tone: toTone(tagCompliance?.severity),
  },
  {
    title: "Ownership Completeness",
    value: formatPercent(ownership?.coverage?.allocated_pct || 0),
    detail: (ownership?.coverage?.allocated_pct || 0) < 90 ? "Unowned spend is reducing accountability." : "Ownership mapping is stable.",
    owner: ownership?.recommended_owner || "FinOps",
    tone: toTone(ownership?.severity),
  },
  {
    title: "Currency/Basis Integrity",
    value: formatPercent(100 - (currencyBasis?.mismatch_spend_pct || 0)),
    detail: (currencyBasis?.mismatch_spend_pct || 0) > 1 ? "Currency/basis drift detected." : "Currency and basis are consistent.",
    owner: currencyBasis?.recommended_owner || "Finance",
    tone: toTone(currencyBasis?.severity),
  },
  {
    title: "Policy Violations",
    value: `${violationCount} rows / ${formatPercent(violationPct)}`,
    detail:
      toTone(violationsSeverity) === "risk"
        ? "Violation spend needs remediation."
        : toTone(violationsSeverity) === "watch"
          ? "Policy exposure needs review."
          : "Policy exposure is within threshold.",
    owner: "Security",
    tone: toTone(violationsSeverity),
  },
  {
    title: "Governance Confidence",
    value: confidenceLabel(governanceConfidence),
    detail:
      String(governanceConfidence || "low").toLowerCase() === "high"
        ? "Controls are executive-ready."
        : "Control posture needs review.",
    owner: "FinOps Governance",
    tone:
      String(governanceConfidence || "low").toLowerCase() === "high"
        ? "good"
        : String(governanceConfidence || "low").toLowerCase() === "medium"
          ? "watch"
          : "risk",
  },
];

export const buildDataQualityActions = ({
  freshnessLagHours,
  missingDays,
  duplicates,
  denominatorSeverity,
}: {
  freshnessLagHours: number;
  missingDays: number;
  duplicates: number;
  denominatorSeverity: string;
}): ActionItem[] => {
  const actions: ActionItem[] = [];
  if (freshnessLagHours > 24) {
    actions.push({
      priority: "P1",
      title: "Recover ingestion freshness",
      detail: `Lag ${freshnessLagHours.toFixed(2)}h. Backfill latest window and restore SLA.`,
      owner: "Data Engineering",
    });
  }
  if (missingDays > 0) {
    actions.push({
      priority: "P1",
      title: "Backfill missing billing days",
      detail: `${missingDays} missing day(s). Restore continuity before reporting.`,
      owner: "Data Engineering",
    });
  }
  if (duplicates > 0) {
    actions.push({
      priority: duplicates > 1 ? "P1" : "P2",
      title: "Execute dedupe controls",
      detail: `Duplicate count ${duplicates}. Enforce idempotent ingestion keys.`,
      owner: "Data Engineering",
    });
  }
  if (denominatorSeverity !== "pass") {
    actions.push({
      priority: denominatorSeverity === "fail" ? "P1" : "P2",
      title: "Stabilize denominator mappings",
      detail: "Resolve denominator completeness and granularity gaps.",
      owner: "Product Analytics",
    });
  }
  if (!actions.length) {
    actions.push({
      priority: "P3",
      title: "Maintain operational controls",
      detail: "No critical blockers. Keep SLA and integrity checks in place.",
      owner: "Data Engineering",
    });
  }
  return actions.slice(0, 4);
};

export const buildGovernanceActions = ({
  tagCompliancePct,
  allocatedPct,
  mismatchPct,
  violatedPct,
}: {
  tagCompliancePct: number;
  allocatedPct: number;
  mismatchPct: number;
  violatedPct: number;
}): ActionItem[] => {
  const actions: ActionItem[] = [];
  if (tagCompliancePct < 95) {
    actions.push({
      priority: tagCompliancePct < 90 ? "P1" : "P2",
      title: "Raise mandatory tag compliance",
      detail: `Compliance ${tagCompliancePct.toFixed(2)}%. Target >= 95%.`,
      owner: "FinOps + Platform",
    });
  }
  if (allocatedPct < 95) {
    actions.push({
      priority: allocatedPct < 90 ? "P1" : "P2",
      title: "Close ownership attribution gaps",
      detail: `Ownership coverage ${allocatedPct.toFixed(2)}%. Resolve unowned spend.`,
      owner: "FinOps",
    });
  }
  if (mismatchPct > 1) {
    actions.push({
      priority: mismatchPct > 3 ? "P1" : "P2",
      title: "Correct currency/basis drift",
      detail: `Mismatch spend ${mismatchPct.toFixed(2)}%. Align basis across sources.`,
      owner: "Finance",
    });
  }
  if (violatedPct > 1) {
    actions.push({
      priority: violatedPct > 3 ? "P1" : "P2",
      title: "Remediate policy-violated spend",
      detail: `Violated spend ${violatedPct.toFixed(2)}%. Escalate top violations.`,
      owner: "Security + Governance",
    });
  }
  if (!actions.length) {
    actions.push({
      priority: "P3",
      title: "Sustain governance baseline",
      detail: "Controls are healthy. Continue monthly audit and verification.",
      owner: "FinOps Governance",
    });
  }
  return actions.slice(0, 4);
};
