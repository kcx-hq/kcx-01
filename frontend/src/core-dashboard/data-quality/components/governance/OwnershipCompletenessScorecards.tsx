import React from "react";
import type { OwnershipCompletenessPayload } from "../../types";
import { formatCurrency, formatPercent } from "../../utils/governance.format";
import { GateStatusBadge } from "./GateStatusBadge";

interface Props {
  data: OwnershipCompletenessPayload | null;
  currency?: string;
}

export function OwnershipCompletenessScorecards({ data, currency = "USD" }: Props) {
  if (!data) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">Ownership Completeness Scorecards</h3>
        <GateStatusBadge status={data.severity} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card label="Completeness score" value={formatPercent(data.completeness_score_pct)} />
        <Card label="Unowned spend" value={formatCurrency(data.unowned_spend, currency)} />
        <Card label="Mapping stability" value={formatPercent(data.coverage.mapping_stability_pct)} />
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Required ownership fields</p>
        <p className="mt-1 text-sm font-semibold text-slate-700">{data.required_fields.join(", ")}</p>
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

export default OwnershipCompletenessScorecards;
