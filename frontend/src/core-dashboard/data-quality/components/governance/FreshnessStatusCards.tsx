import React from "react";
import type { FreshnessStatusPayload } from "../../types";
import { formatDateTime, formatPercent } from "../../utils/governance.format";
import { GateStatusBadge } from "./GateStatusBadge";

interface Props {
  data: FreshnessStatusPayload | null;
}

export function FreshnessStatusCards({ data }: Props) {
  if (!data) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">Freshness Status Cards</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card label="Reliability score" value={formatPercent(data.summary.reliability_score)} />
        <Card label="Freshness lag" value={`${Number(data.summary.freshness_lag_hours || 0).toFixed(2)}h`} />
        <Card label="Duplicate load %" value={formatPercent(data.summary.duplicate_load_pct)} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {data.sources.map((row) => (
          <article key={`${row.provider}-${row.source_id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black text-slate-800">{row.provider} / {row.source_id}</p>
              <GateStatusBadge status={row.status} />
            </div>
            <p className="mt-1 text-[11px] text-slate-600">Last success: {formatDateTime(row.last_success_ts)}</p>
            <p className="mt-1 text-[11px] text-slate-600">Lag: {Number(row.lag_hours || 0).toFixed(2)}h | SLA: {row.sla_soft_hours}/{row.sla_hard_hours}h</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
    </article>
  );
}

export default FreshnessStatusCards;
