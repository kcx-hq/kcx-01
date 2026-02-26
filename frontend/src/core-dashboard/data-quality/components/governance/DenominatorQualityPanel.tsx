import type { GovernanceModel } from "../../types";
import { formatCurrency, formatPercent, getRiskPillClass, getScoreToneClass } from "../../utils/governance.format";
import PanelShell from "./PanelShell";

interface DenominatorQualityPanelProps {
  governance: GovernanceModel;
}

export function DenominatorQualityPanel({ governance }: DenominatorQualityPanelProps) {
  const model = governance.denominatorQuality;
  const currency = governance.currency || "USD";

  return (
    <PanelShell
      title="Denominator & Unit Metric Data Quality"
      subtitle="Coverage, granularity alignment, staleness checks, and trust gate for unit economics."
      rightSlot={
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${getRiskPillClass(
            model.trustGateStatus === "blocked"
              ? "red"
              : model.trustGateStatus === "flagged"
              ? "amber"
              : "green"
          )}`}
        >
          Unit KPI Gate: {model.trustGateStatus}
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Coverage %" value={formatPercent(model.denominatorCoveragePct)} tone={model.denominatorCoveragePct} />
        <Metric label="Missing Denominator %" value={formatPercent(model.missingDenominatorSpendPct)} tone={100 - model.missingDenominatorSpendPct} />
        <Metric label="Missing Denominator Spend" value={formatCurrency(model.missingDenominatorSpend, currency)} tone={100 - model.missingDenominatorSpendPct} />
        <Metric label="Granularity Alignment %" value={formatPercent(model.granularityAlignmentPct)} tone={model.granularityAlignmentPct} />
        <Metric label="Granularity Mismatch Spend" value={formatCurrency(model.granularityMismatchSpend, currency)} tone={model.granularityAlignmentPct} />
        <Metric label="Staleness %" value={formatPercent(model.denominatorStalenessPct)} tone={100 - model.denominatorStalenessPct} />
      </div>
    </PanelShell>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-black ${getScoreToneClass(tone)}`}>{value}</p>
    </div>
  );
}

export default DenominatorQualityPanel;
