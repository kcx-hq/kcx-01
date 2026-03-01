import React from "react";
import type { DenominatorQualityPayload } from "../../types";
import { formatPercent } from "../../utils/governance.format";
import { GateStatusBadge } from "./GateStatusBadge";

interface Props {
  data: DenominatorQualityPayload | null;
}

export function DenominatorQualityGatePanel({ data }: Props) {
  if (!data) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">Denominator Quality Gate</h3>
        <GateStatusBadge status={data.severity} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card label="Availability" value={formatPercent(data.availability_pct)} />
        <Card label="Mapping completeness" value={formatPercent(data.mapping_completeness_pct)} />
        <Card label="Invalid/outlier volume" value={formatPercent(data.invalid_volume_pct)} />
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        <p>Readiness: <span className="font-black">{data.readiness_status}</span></p>
        <p>Reason codes: <span className="font-black">{data.reason_codes.join(", ") || "none"}</span></p>
        <p>Affected metrics: <span className="font-black">{data.affected_metric_keys.join(", ") || "none"}</span></p>
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

export default DenominatorQualityGatePanel;
