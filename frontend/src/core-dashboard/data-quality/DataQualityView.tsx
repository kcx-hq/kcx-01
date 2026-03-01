import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
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
import type {
  ConfidenceLevel,
  CurrencyBasisPayload,
  GovernanceFilters,
  OwnershipCompletenessPayload,
  TagCompliancePayload,
} from "./types";
import { formatPercent } from "./utils/governance.format";

interface DataQualityViewProps {
  filters?: GovernanceFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

type SectionView = "governance" | "data-quality";

type InsightTone = "good" | "watch" | "risk";

interface InsightCardModel {
  title: string;
  value: string;
  detail: string;
  owner: string;
  tone: InsightTone;
}

interface ActionItem {
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

const confidenceLabel = (level?: ConfidenceLevel | string): string => {
  const value = String(level || "").toLowerCase();
  if (value === "high") return "High";
  if (value === "medium") return "Medium";
  return "Low";
};

const buildDataQualityInsights = ({
  freshnessLagHours,
  reliabilityScore,
  coverageCompleteness,
  duplicatesPct,
  denominatorAvailability,
  denominatorSeverity,
}: {
  freshnessLagHours: number | null | undefined;
  reliabilityScore: number;
  coverageCompleteness: number;
  duplicatesPct: number;
  denominatorAvailability: number;
  denominatorSeverity: string;
}): InsightCardModel[] => [
  {
    title: "Pipeline Freshness",
    value: `${Number(freshnessLagHours || 0).toFixed(2)}h lag`,
    detail:
      Number(freshnessLagHours || 0) > 24
        ? "Data is stale for planning decisions."
        : "Ingestion freshness is within operational range.",
    owner: "Data Engineering",
    tone: Number(freshnessLagHours || 0) > 36 ? "risk" : Number(freshnessLagHours || 0) > 24 ? "watch" : "good",
  },
  {
    title: "Ingestion Reliability",
    value: `${reliabilityScore.toFixed(2)} / 100`,
    detail:
      reliabilityScore < 75
        ? "Quality confidence is weak and requires pipeline remediation."
        : reliabilityScore < 90
        ? "Moderate reliability, monitor missing days and duplicates."
        : "Strong reliability for KPI usage.",
    owner: "Data Engineering",
    tone: reliabilityScore < 75 ? "risk" : reliabilityScore < 90 ? "watch" : "good",
  },
  {
    title: "Coverage Completeness",
    value: formatPercent(coverageCompleteness),
    detail:
      coverageCompleteness < 90
        ? "Coverage gap can distort spend and trend baselines."
        : coverageCompleteness < 98
        ? "Minor account/day completeness drift."
        : "Coverage is stable across expected scope.",
    owner: "FinOps Platform",
    tone: coverageCompleteness < 90 ? "risk" : coverageCompleteness < 98 ? "watch" : "good",
  },
  {
    title: "Duplicate Load Risk",
    value: formatPercent(duplicatesPct),
    detail:
      duplicatesPct > 1
        ? "Duplicate ingestion may overstate cost and utilization."
        : duplicatesPct > 0
        ? "Small duplicate presence detected."
        : "No duplicate load issues detected.",
    owner: "Data Engineering",
    tone: duplicatesPct > 1 ? "risk" : duplicatesPct > 0 ? "watch" : "good",
  },
  {
    title: "Denominator Readiness",
    value: formatPercent(denominatorAvailability),
    detail:
      denominatorSeverity === "fail"
        ? "Unit economics denominator gate is blocked."
        : denominatorSeverity === "warn"
        ? "Denominator quality is partially ready."
        : "Denominator quality supports trusted unit KPIs.",
    owner: "Product Analytics",
    tone: toTone(denominatorSeverity),
  },
];

const buildGovernanceInsights = ({
  tagCompliance,
  ownership,
  currencyBasis,
  violationPct,
  violationCount,
  governanceConfidence,
}: {
  tagCompliance: TagCompliancePayload | null;
  ownership: OwnershipCompletenessPayload | null;
  currencyBasis: CurrencyBasisPayload | null;
  violationPct: number;
  violationCount: number;
  governanceConfidence: ConfidenceLevel | string | undefined;
}): InsightCardModel[] => [
  {
    title: "Tag Policy Compliance",
    value: formatPercent(tagCompliance?.spend_weighted_compliance_pct || 0),
    detail:
      (tagCompliance?.spend_weighted_compliance_pct || 0) < 90
        ? "Tag debt is materially impacting allocation quality."
        : "Tag coverage supports governance reporting.",
    owner: tagCompliance?.recommended_owner || "FinOps",
    tone: toTone(tagCompliance?.severity),
  },
  {
    title: "Ownership Completeness",
    value: formatPercent(ownership?.coverage?.allocated_pct || 0),
    detail:
      (ownership?.coverage?.allocated_pct || 0) < 90
        ? "Unowned spend weakens accountability and chargeback readiness."
        : "Ownership mapping is broadly stable.",
    owner: ownership?.recommended_owner || "FinOps",
    tone: toTone(ownership?.severity),
  },
  {
    title: "Currency/Basis Integrity",
    value: formatPercent(100 - (currencyBasis?.mismatch_spend_pct || 0)),
    detail:
      (currencyBasis?.mismatch_spend_pct || 0) > 1
        ? "Currency or basis drift can skew financial comparability."
        : "Currency and basis treatment are consistent.",
    owner: currencyBasis?.recommended_owner || "Finance",
    tone: toTone(currencyBasis?.severity),
  },
  {
    title: "Policy Violations",
    value: `${violationCount} rows / ${formatPercent(violationPct)}`,
    detail:
      violationPct > 1
        ? "Violation spend requires governance remediation before approvals."
        : "Policy exposure is within acceptable threshold.",
    owner: "Security",
    tone: violationPct > 3 ? "risk" : violationPct > 1 ? "watch" : "good",
  },
  {
    title: "Governance Confidence",
    value: confidenceLabel(governanceConfidence),
    detail:
      String(governanceConfidence || "low").toLowerCase() === "high"
        ? "Controls are strong enough for executive consumption."
        : "Control posture needs review before finance sign-off.",
    owner: "FinOps Governance",
    tone:
      String(governanceConfidence || "low").toLowerCase() === "high"
        ? "good"
        : String(governanceConfidence || "low").toLowerCase() === "medium"
        ? "watch"
        : "risk",
  },
];

const toneClasses: Record<InsightTone, string> = {
  good: "border-emerald-200 bg-emerald-50/70",
  watch: "border-amber-200 bg-amber-50/70",
  risk: "border-rose-200 bg-rose-50/70",
};

const buildDataQualityActions = ({
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
      detail: `Lag is ${freshnessLagHours.toFixed(2)}h. Backfill latest window and verify source pipeline SLA.`,
      owner: "Data Engineering",
    });
  }
  if (missingDays > 0) {
    actions.push({
      priority: "P1",
      title: "Backfill missing billing days",
      detail: `${missingDays} missing day(s) in trailing window. Restore continuity before trend consumption.`,
      owner: "Data Engineering",
    });
  }
  if (duplicates > 0) {
    actions.push({
      priority: duplicates > 1 ? "P1" : "P2",
      title: "Execute dedupe controls",
      detail: `Duplicate load count is ${duplicates}. Enforce idempotent ingestion keys.`,
      owner: "Data Engineering",
    });
  }
  if (denominatorSeverity !== "pass") {
    actions.push({
      priority: denominatorSeverity === "fail" ? "P1" : "P2",
      title: "Stabilize denominator mappings",
      detail: "Resolve denominator completeness/granularity gaps for unit economics readiness.",
      owner: "Product Analytics",
    });
  }
  if (!actions.length) {
    actions.push({
      priority: "P3",
      title: "Maintain operational controls",
      detail: "No critical data quality blockers. Keep SLA monitoring and weekly integrity checks.",
      owner: "Data Engineering",
    });
  }
  return actions.slice(0, 4);
};

const buildGovernanceActions = ({
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
      detail: `Current compliance ${tagCompliancePct.toFixed(2)}%. Target >= 95% on high-impact spend.`,
      owner: "FinOps + Platform",
    });
  }
  if (allocatedPct < 95) {
    actions.push({
      priority: allocatedPct < 90 ? "P1" : "P2",
      title: "Close ownership attribution gaps",
      detail: `Ownership coverage ${allocatedPct.toFixed(2)}%. Resolve unowned spend buckets.`,
      owner: "FinOps",
    });
  }
  if (mismatchPct > 1) {
    actions.push({
      priority: mismatchPct > 3 ? "P1" : "P2",
      title: "Correct currency/basis drift",
      detail: `Mismatch spend ${mismatchPct.toFixed(2)}%. Align accounting basis across sources.`,
      owner: "Finance",
    });
  }
  if (violatedPct > 1) {
    actions.push({
      priority: violatedPct > 3 ? "P1" : "P2",
      title: "Remediate policy-violated spend",
      detail: `Violated spend ${violatedPct.toFixed(2)}%. Escalate top violating services/teams.`,
      owner: "Security + Governance",
    });
  }
  if (!actions.length) {
    actions.push({
      priority: "P3",
      title: "Sustain governance baseline",
      detail: "Controls are healthy. Continue monthly policy audit and ownership verification.",
      owner: "FinOps Governance",
    });
  }
  return actions.slice(0, 4);
};

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
        reliabilityScore,
        coverageCompleteness,
        duplicatesPct,
        denominatorAvailability,
        denominatorSeverity,
      }),
    [
      coverageCompleteness,
      denominatorAvailability,
      denominatorSeverity,
      duplicatesPct,
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
        governanceConfidence: banner.data?.confidence_level,
      }),
    [banner.data?.confidence_level, currencyBasis.data, ownership.data, tagCompliance.data, violatedPct, violationCount],
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

  if (loading) return <DataQualityStates type="loading" />;
  if (!hasAnyData) return <DataQualityStates type="empty" />;

  return (
    <div className="core-shell animate-in fade-in duration-300 space-y-4">
      <div className="core-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2">
              <ShieldCheck size={18} className="text-[var(--brand-primary)]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight md:text-xl">Governance & Data Quality</h1>
              <p className="text-xs text-[var(--text-muted)] md:text-sm">
                FinOps control tower for trust, policy, ownership, and readiness.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Executive confidence</p>
            <p className="text-sm font-black text-slate-800">{confidenceLabel(banner.data?.confidence_level)}</p>
          </div>
        </div>
      </div>

      <QualityImpactBanner banner={banner.data} />

      <section className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSection("governance")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
              activeSection === "governance"
                ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
            }`}
            aria-pressed={activeSection === "governance"}
          >
            Governance
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("data-quality")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
              activeSection === "data-quality"
                ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
            }`}
            aria-pressed={activeSection === "data-quality"}
          >
            Data Quality
          </button>
        </div>
      </section>

      {activeSection === "data-quality" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 md:text-lg">Data Quality</h2>
              <p className="mt-1 text-xs text-slate-600">
                Freshness, coverage, and denominator readiness that determine whether KPI baselines are trustworthy.
              </p>
            </div>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              Reliability {reliabilityScore.toFixed(2)} / 100
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {dataQualityInsights.map((item) => (
              <article key={item.title} className={`rounded-xl border p-3 ${toneClasses[item.tone]}`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">{item.title}</p>
                <p className="mt-1 text-lg font-black text-slate-900">{item.value}</p>
                <p className="mt-1 text-[11px] text-slate-700">{item.detail}</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Owner: {item.owner}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-600">Priority Action Queue</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {dataQualityActions.map((action) => (
                <article key={`${action.priority}-${action.title}`} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-black text-slate-800">
                    {action.priority} - {action.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">{action.detail}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Owner: {action.owner}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <FreshnessStatusCards data={freshness.data} />
            <CoverageGatesTable data={coverage.data} />
            <DenominatorQualityGatePanel data={denominator.data} />
          </div>
        </section>
      ) : null}

      {activeSection === "governance" ? (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 md:text-lg">Governance</h2>
            <p className="mt-1 text-xs text-slate-600">
              Controls for policy, ownership, tag quality, and accounting consistency across spend.
            </p>
          </div>
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            Violated Spend {formatPercent(violatedPct)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {governanceInsights.map((item) => (
            <article key={item.title} className={`rounded-xl border p-3 ${toneClasses[item.tone]}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">{item.title}</p>
              <p className="mt-1 text-lg font-black text-slate-900">{item.value}</p>
              <p className="mt-1 text-[11px] text-slate-700">{item.detail}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Owner: {item.owner}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-600">Priority Action Queue</p>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            {governanceActions.map((action) => (
              <article key={`${action.priority}-${action.title}`} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-black text-slate-800">
                  {action.priority} - {action.title}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">{action.detail}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Owner: {action.owner}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <TagComplianceMatrix data={tagCompliance.data} />
          <OwnershipCompletenessScorecards data={ownership.data} />
          <CurrencyBasisChecksPanel data={currencyBasis.data} />
          <ControlViolationsTable data={controlViolations.data} />
        </div>
      </section>
      ) : null}
    </div>
  );
};

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
        active
          ? "border-emerald-400 bg-emerald-100 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
      }`}
    >
      {label}
    </button>
  );
}

function ScopeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
      {label}
    </span>
  );
}

export default DataQualityView;
