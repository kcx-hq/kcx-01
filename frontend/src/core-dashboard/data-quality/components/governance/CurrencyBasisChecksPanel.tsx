import React from "react";
import type { CurrencyBasisPayload } from "../../types";
import { formatPercent } from "../../utils/governance.format";
import { GateStatusBadge } from "./GateStatusBadge";

interface Props {
  data: CurrencyBasisPayload | null;
}

export function CurrencyBasisChecksPanel({ data }: Props) {
  if (!data) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">Currency & Cost Basis Checks</h3>
        <GateStatusBadge status={data.severity} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card label="FX source" value={data.fx_health.source_status} />
        <Card label="Missing FX pairs" value={String(data.fx_health.missing_pairs)} />
        <Card label="Mismatch spend %" value={formatPercent(data.mismatch_spend_pct)} />
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        <p>Dominant currency: <span className="font-black">{data.basis_checks.dominant_currency}</span></p>
        <p>Amortization consistency: <span className="font-black">{formatPercent(data.basis_checks.amortization_mode_consistency)}</span></p>
        <p>Commitment treatment consistency: <span className="font-black">{formatPercent(data.basis_checks.commitment_treatment_consistency)}</span></p>
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

export default CurrencyBasisChecksPanel;
