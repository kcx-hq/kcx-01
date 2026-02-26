import type { GovernanceModel } from "../../types";
import { formatDateTime, formatPercent, getScoreToneClass } from "../../utils/governance.format";
import PanelShell from "./PanelShell";

interface IngestionReliabilityPanelProps {
  governance: GovernanceModel;
}

export function IngestionReliabilityPanel({ governance }: IngestionReliabilityPanelProps) {
  const model = governance.ingestionReliability;

  return (
    <PanelShell
      title="Data Freshness & Ingestion Reliability"
      subtitle="Freshness lag, missing days, duplicate loads, and account ingestion completeness."
    >
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Reliability Score" value={formatPercent(model.score)} tone={model.score} />
        <Metric
          label="Freshness Lag (hours)"
          value={model.freshnessLagHours === null ? "N/A" : model.freshnessLagHours.toFixed(2)}
          tone={model.freshnessLagHours === null ? 30 : model.freshnessLagHours <= 6 ? 100 : model.freshnessLagHours <= 24 ? 70 : 30}
        />
        <Metric label="Missing Days (30d)" value={String(model.missingDays30d)} tone={model.missingDays30d === 0 ? 100 : model.missingDays30d <= 2 ? 70 : 30} />
        <Metric label="Duplicate Load %" value={formatPercent(model.duplicateLoadPct)} tone={100 - model.duplicateLoadPct * 30} />
        <Metric label="Late-arriving Rows" value={String(model.lateArrivingDataCount)} tone={model.lateArrivingDataCount === 0 ? 100 : 60} />
        <Metric label="Coverage Completeness" value={formatPercent(model.coverageCompletenessPct)} tone={model.coverageCompletenessPct} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Last successful ingestion</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(model.lastSuccessfulIngestion)}</p>
        <p className="mt-1 text-xs text-slate-600">
          Accounts in last 30 days: {model.ingestedAccounts30d} / expected {model.expectedAccounts}
        </p>
        {model.missingDaysList.length > 0 ? (
          <p className="mt-2 text-xs text-amber-700">
            Missing dates: {model.missingDaysList.slice(0, 6).join(", ")}
            {model.missingDaysList.length > 6 ? " ..." : ""}
          </p>
        ) : null}
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

export default IngestionReliabilityPanel;
