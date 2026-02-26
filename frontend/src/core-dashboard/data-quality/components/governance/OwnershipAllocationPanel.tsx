import type { GovernanceModel } from "../../types";
import { formatCurrency, formatPercent, formatSignedPercent, getScoreToneClass } from "../../utils/governance.format";
import PanelShell from "./PanelShell";

interface OwnershipAllocationPanelProps {
  governance: GovernanceModel;
}

export function OwnershipAllocationPanel({ governance }: OwnershipAllocationPanelProps) {
  const model = governance.ownershipAllocation;
  const currency = governance.currency || "USD";

  return (
    <PanelShell
      title="Ownership & Allocation Health"
      subtitle="Allocation coverage, drift, and mapping stability controls."
    >
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Allocated %" value={formatPercent(model.allocatedPct)} tone={model.allocatedPct} />
        <Metric label="Unallocated %" value={formatPercent(model.unallocatedPct)} tone={100 - model.unallocatedPct} />
        <Metric label="Unallocated Spend" value={formatCurrency(model.unallocatedSpend, currency)} tone={100 - model.unallocatedPct} />
        <Metric label="Unallocated Trend MoM" value={formatSignedPercent(model.unallocatedTrendMoM)} tone={100 - Math.max(0, model.unallocatedTrendMoM * 10)} />
        <Metric label="Allocation Confidence" value={formatPercent(model.allocationConfidenceScore)} tone={model.allocationConfidenceScore} />
        <Metric label="Mapping Stability" value={formatPercent(model.mappingStabilityPct)} tone={model.mappingStabilityPct} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Rule churn rate</p>
        <p className={`mt-1 text-2xl font-black ${getScoreToneClass(100 - model.ruleChurnRate)}`}>
          {formatPercent(model.ruleChurnRate)}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Percentage of accounts where dominant owner mapping changed across recent monthly windows.
        </p>
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

export default OwnershipAllocationPanel;
