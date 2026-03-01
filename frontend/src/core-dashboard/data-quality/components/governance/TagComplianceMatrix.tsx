import React from "react";
import type { TagCompliancePayload } from "../../types";
import { formatCurrency, formatPercent } from "../../utils/governance.format";
import { GateStatusBadge } from "./GateStatusBadge";

interface Props {
  data: TagCompliancePayload | null;
  currency?: string;
}

export function TagComplianceMatrix({ data, currency = "USD" }: Props) {
  if (!data) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">Tag Policy Compliance Matrix</h3>
        <GateStatusBadge status={data.severity} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card label="Spend-weighted compliance" value={formatPercent(data.spend_weighted_compliance_pct)} />
        <Card label="Missing-tag spend" value={formatCurrency(data.missing_tag_spend, currency)} />
        <Card label="Invalid value %" value={formatPercent(data.invalid_value_pct)} />
      </div>

      <div className="mt-3 overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.08em] text-slate-600">
            <tr>
              <th className="px-3 py-2">Tag key</th>
              <th className="px-3 py-2 text-right">Coverage %</th>
              <th className="px-3 py-2 text-right">Invalid %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.matrix_rows.map((row) => (
              <tr key={row.key}>
                <td className="px-3 py-2 font-semibold text-slate-800">{row.key}</td>
                <td className="px-3 py-2 text-right">{formatPercent(row.coveragePct)}</td>
                <td className="px-3 py-2 text-right">{formatPercent(row.invalidValuePct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default TagComplianceMatrix;
