import type { GovernanceModel } from "../../types";
import { formatCurrency, formatPercent, getRiskPillClass } from "../../utils/governance.format";
import PanelShell from "./PanelShell";

interface PolicyCompliancePanelProps {
  governance: GovernanceModel;
}

export function PolicyCompliancePanel({ governance }: PolicyCompliancePanelProps) {
  const model = governance.policyCompliance;
  const currency = governance.currency || "USD";

  return (
    <PanelShell
      title="Policy Compliance"
      subtitle="Violation severity, violated spend, and top violating owners/services."
    >
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Violations Count" value={String(model.violationsCount)} />
        <Metric label="Violated Spend" value={formatCurrency(model.violatedSpend, currency)} />
        <Metric label="Violated Spend %" value={formatPercent(model.violatedSpendPct)} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Severity split</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {model.severitySummary.map((row) => (
            <span
              key={row.severity}
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${getRiskPillClass(
                row.severity === "critical" || row.severity === "high"
                  ? "red"
                  : row.severity === "medium"
                  ? "amber"
                  : "green"
              )}`}
            >
              {row.severity}: {row.count} ({formatPercent(row.violatedSpendPct)})
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ListCard
          title="Top violating teams"
          rows={model.topViolatingTeams.slice(0, 5).map((row) => ({
            label: row.owner,
            value: `${formatCurrency(row.violatedSpend, currency)} (${formatPercent(row.violatedSpendPct)})`,
          }))}
        />
        <ListCard
          title="Top violating services"
          rows={model.topViolatingServices.slice(0, 5).map((row) => ({
            label: row.service,
            value: `${formatCurrency(row.violatedSpend, currency)} (${formatPercent(row.violatedSpendPct)})`,
          }))}
        />
      </div>
    </PanelShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function ListCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No violations.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-start justify-between gap-3 text-sm">
              <span className="line-clamp-1 text-slate-700">{row.label}</span>
              <span className="shrink-0 font-semibold text-slate-900">{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PolicyCompliancePanel;
