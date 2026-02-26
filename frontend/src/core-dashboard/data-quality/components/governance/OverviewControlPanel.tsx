import { ShieldCheck } from "lucide-react";
import type { GovernanceModel } from "../../types";
import {
  formatPercent,
  getBarToneClass,
  getRiskPillClass,
  getScoreToneClass,
} from "../../utils/governance.format";
import PanelShell from "./PanelShell";

interface OverviewControlPanelProps {
  governance: GovernanceModel;
}

export function OverviewControlPanel({ governance }: OverviewControlPanelProps) {
  const scoreEntries = [
    { key: "Tag Compliance", value: governance.overview.scores.tagComplianceScore },
    { key: "Allocation Confidence", value: governance.overview.scores.allocationConfidenceScore },
    { key: "Shared Pool Health", value: governance.overview.scores.sharedPoolHealthScore },
    { key: "Policy Compliance", value: governance.overview.scores.policyComplianceScore },
    { key: "Ingestion Reliability", value: governance.overview.scores.ingestionReliabilityScore },
    { key: "Denominator Coverage", value: governance.overview.scores.denominatorCoverageScore },
  ];

  return (
    <PanelShell
      title="Governance Overview"
      subtitle={governance.purpose}
      rightSlot={
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getRiskPillClass(
            governance.overview.state
          )}`}
        >
          <ShieldCheck size={13} />
          Trust State: {governance.overview.state}
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Overall Data Trust Score
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className={`text-4xl font-black ${getScoreToneClass(governance.overview.trustScore)}`}>
              {governance.overview.trustScore.toFixed(2)}
            </span>
            <span className="pb-1 text-sm text-slate-500">/ 100</span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Composite score with hard gates for freshness, missing days, currency consistency, and denominator reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {scoreEntries.map((entry) => (
            <div key={entry.key} className="rounded-xl border border-slate-200 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {entry.key}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className={`text-lg font-black ${getScoreToneClass(entry.value)}`}>
                  {formatPercent(entry.value)}
                </span>
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  target: green
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full transition-all ${getBarToneClass(entry.value)}`}
                  style={{ width: `${Math.max(0, Math.min(100, entry.value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

export default OverviewControlPanel;
