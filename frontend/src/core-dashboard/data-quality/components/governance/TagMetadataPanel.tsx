import type { GovernanceModel } from "../../types";
import {
  formatCurrency,
  formatPercent,
  getBarToneClass,
  getScoreToneClass,
} from "../../utils/governance.format";
import PanelShell from "./PanelShell";

interface TagMetadataPanelProps {
  governance: GovernanceModel;
}

export function TagMetadataPanel({ governance }: TagMetadataPanelProps) {
  const model = governance.tagMetadata;
  const currency = governance.currency || "USD";

  return (
    <PanelShell
      title="Tag & Metadata Compliance"
      subtitle="Coverage, invalid values, and top spend without required metadata."
    >
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Tag Coverage" value={formatPercent(model.tagCoveragePct)} tone={model.tagCoveragePct} />
        <Metric label="Invalid Value %" value={formatPercent(model.invalidValuePct)} tone={100 - model.invalidValuePct} />
        <Metric label="Untagged Spend" value={formatCurrency(model.untaggedSpend, currency)} tone={100 - model.untaggedSpendPct} />
        <Metric label="Untagged %" value={formatPercent(model.untaggedSpendPct)} tone={100 - model.untaggedSpendPct} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <div className="space-y-3">
          {model.coverageByKey.map((row) => (
            <div key={row.key} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600">{row.key}</p>
                <p className={`text-sm font-black ${getScoreToneClass(row.coveragePct)}`}>
                  {formatPercent(row.coveragePct)}
                </p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${getBarToneClass(row.coveragePct)}`}
                  style={{ width: `${Math.max(0, Math.min(100, row.coveragePct))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Invalid values in tagged rows: {formatPercent(row.invalidValuePct)}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <ListCard
            title="Top services with missing tags"
            rows={model.topMissingByService.slice(0, 5).map((item) => ({
              label: item.service,
              value: `${formatCurrency(item.spend, currency)} (${formatPercent(item.spendPct)})`,
            }))}
          />
          <ListCard
            title="Top accounts with missing tags"
            rows={model.topMissingByAccount.slice(0, 5).map((item) => ({
              label: item.account,
              value: `${formatCurrency(item.spend, currency)} (${formatPercent(item.spendPct)})`,
            }))}
          />
        </div>
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
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-black ${getScoreToneClass(tone)}`}>{value}</p>
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
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">No entries.</p>
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

export default TagMetadataPanel;
