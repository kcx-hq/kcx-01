import type { GovernanceModel } from "../../types";
import { formatCurrency, formatPercent, formatSignedPercent, getScoreToneClass } from "../../utils/governance.format";
import PanelShell from "./PanelShell";

interface SharedPoolIntegrityPanelProps {
  governance: GovernanceModel;
}

export function SharedPoolIntegrityPanel({ governance }: SharedPoolIntegrityPanelProps) {
  const model = governance.sharedPoolIntegrity;
  const currency = governance.currency || "USD";

  return (
    <PanelShell
      title="Shared Cost Pool Integrity"
      subtitle="Pool size, drift, leakage, and top contributors to growth."
    >
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Shared Pool Spend" value={formatCurrency(model.sharedPoolSpend, currency)} tone={100 - model.sharedPoolPct} />
        <Metric label="Shared Pool %" value={formatPercent(model.sharedPoolPct)} tone={100 - model.sharedPoolPct} />
        <Metric label="Pool Drift" value={formatSignedPercent(model.poolDrift)} tone={100 - Math.min(100, Math.abs(model.poolDrift) * 20)} />
        <Metric label="Leakage %" value={formatPercent(model.leakagePct)} tone={100 - model.leakagePct * 20} />
        <Metric label="Leakage Spend" value={formatCurrency(model.leakageSpend, currency)} tone={100 - model.leakagePct * 20} />
        <Metric label="Basis Stability" value={formatPercent(model.basisStabilityScore)} tone={model.basisStabilityScore} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
          Top contributors to shared pool growth
        </p>
        {model.topContributorsToGrowth.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No positive growth contributors in current comparison window.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {model.topContributorsToGrowth.slice(0, 5).map((row) => (
              <div key={row.service} className="flex items-start justify-between gap-3 text-sm">
                <span className="line-clamp-1 text-slate-700">{row.service}</span>
                <span className="shrink-0 font-semibold text-slate-900">
                  {formatSignedPercent((row.delta / Math.max(1, model.sharedPoolSpend)) * 100)} ({formatCurrency(row.delta, currency)})
                </span>
              </div>
            ))}
          </div>
        )}
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
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-black ${getScoreToneClass(tone)}`}>{value}</p>
    </div>
  );
}

export default SharedPoolIntegrityPanel;
