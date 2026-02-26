import type { GovernanceModel } from "../../types";
import {
  formatCurrency,
  formatPercent,
  getRiskPillClass,
  numberOrZero,
} from "../../utils/governance.format";
import PanelShell from "./PanelShell";

interface TopRisksPanelProps {
  governance: GovernanceModel;
}

export function TopRisksPanel({ governance }: TopRisksPanelProps) {
  const risks = governance.overview.topRisks || [];
  const currency = governance.currency || "USD";

  return (
    <PanelShell
      title="Top 5 Risks To KPI Trustworthiness"
      subtitle="Ranked by severity and impacted spend share."
    >
      {risks.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          No active trust blockers detected in the current scope.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <th className="px-3 py-2">Risk</th>
                <th className="px-3 py-2">Level</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Threshold</th>
                <th className="px-3 py-2">Impacted Spend</th>
                <th className="px-3 py-2">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {risks.map((risk) => (
                <tr key={risk.id} className="align-top">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">{risk.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{risk.steps?.[0] || "Review risk details."}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getRiskPillClass(
                        risk.level
                      )}`}
                    >
                      {risk.level}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    {formatPercent(risk.value)}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{risk.threshold}</td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(risk.impactedSpend, currency)}
                    </p>
                    <p className="text-xs text-slate-500">{formatPercent(numberOrZero(risk.impactPct))} of scoped spend</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{risk.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelShell>
  );
}

export default TopRisksPanel;
