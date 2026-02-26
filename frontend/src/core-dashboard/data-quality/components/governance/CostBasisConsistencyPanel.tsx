import type { GovernanceModel } from "../../types";
import { formatCurrency, formatPercent, getRiskPillClass } from "../../utils/governance.format";
import PanelShell from "./PanelShell";

interface CostBasisConsistencyPanelProps {
  governance: GovernanceModel;
}

export function CostBasisConsistencyPanel({ governance }: CostBasisConsistencyPanelProps) {
  const model = governance.costBasisConsistency;
  const currency = governance.currency || "USD";

  return (
    <PanelShell
      title="Cost Basis Consistency"
      subtitle="Currency uniformity, amortization mode consistency, and cost-basis drift events."
    >
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Dominant Currency" value={model.dominantCurrency} />
        <Metric label="Currency Consistency" value={formatPercent(model.currencyConsistencyPct)} />
        <Metric label="Amortization Mode Consistency" value={formatPercent(model.amortizationModeConsistency)} />
        <Metric label="Credits/Refund Consistency" value={formatPercent(model.creditsRefundConsistency)} />
        <Metric label="Commitment Treatment" value={formatPercent(model.commitmentTreatmentConsistency)} />
        <Metric label="Detected Modes" value={model.detectedModes.join(", ") || "N/A"} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
            Currency split
          </p>
          <div className="mt-2 space-y-2">
            {model.currencies.map((entry) => (
              <div key={entry.currency} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-700">{entry.currency}</span>
                <span className="text-slate-900">
                  {formatCurrency(entry.spend, entry.currency || currency)} ({formatPercent(entry.spendPct)})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
            Cost basis drift events
          </p>
          {model.costBasisDriftEvents.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-700">No drift events detected.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {model.costBasisDriftEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-slate-200 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{event.label}</p>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getRiskPillClass(
                        event.severity === "high"
                          ? "red"
                          : event.severity === "medium"
                          ? "amber"
                          : "green"
                      )}`}
                    >
                      {event.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{event.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PanelShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

export default CostBasisConsistencyPanel;
