import type { GovernanceModel } from "../../types";
import { getRiskPillClass } from "../../utils/governance.format";
import PanelShell from "./PanelShell";

interface GovernanceRunbookPanelProps {
  governance: GovernanceModel;
}

export function GovernanceRunbookPanel({ governance }: GovernanceRunbookPanelProps) {
  const kpiRows = governance.kpiDictionary || [];
  const rootCausePaths = governance.rootCausePaths || [];
  const driftSignals = governance.driftSignals || [];
  const hardGates = governance.weightingModel?.hardGates || [];

  return (
    <PanelShell
      title="Governance Controls, Drift Detection & Root-Cause Paths"
      subtitle="Deterministic playbooks and formula dictionary for audit-safe troubleshooting."
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              KPI Dictionary
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  <tr>
                    <th className="px-2 py-1.5">Metric</th>
                    <th className="px-2 py-1.5">Formula</th>
                    <th className="px-2 py-1.5">Thresholds</th>
                    <th className="px-2 py-1.5">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kpiRows.map((row) => (
                    <tr key={row.metric}>
                      <td className="px-2 py-1.5 font-semibold text-slate-900">{row.metric}</td>
                      <td className="px-2 py-1.5 font-mono text-[11px] text-slate-700">{row.formula}</td>
                      <td className="px-2 py-1.5 text-slate-700">
                        G:{row.thresholds.green} A:{row.thresholds.amber} R:{row.thresholds.red}
                      </td>
                      <td className="px-2 py-1.5 text-slate-700">{row.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Drift & Degradation Signals
            </p>
            <div className="mt-2 space-y-2">
              {driftSignals.map((signal) => (
                <div key={signal.metric} className="rounded-lg border border-slate-200 bg-slate-50/70 p-2">
                  <p className="text-sm font-semibold text-slate-900">{signal.metric}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{signal.decayCondition}</p>
                  <p className="mt-1 text-xs font-medium text-slate-700">Action: {signal.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Root-cause paths
            </p>
            <div className="mt-2 space-y-2">
              {rootCausePaths.map((path) => (
                <div key={path.riskId} className="rounded-lg border border-slate-200 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{path.title}</p>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getRiskPillClass(
                        path.level
                      )}`}
                    >
                      {path.level}
                    </span>
                  </div>
                  <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-slate-700">
                    {path.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Hard trust gates
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {hardGates.map((gate) => (
                <li key={gate}>- {gate}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Non-overlap rules
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {governance.nonOverlap.map((rule) => (
                <li key={rule}>- {rule}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

export default GovernanceRunbookPanel;
