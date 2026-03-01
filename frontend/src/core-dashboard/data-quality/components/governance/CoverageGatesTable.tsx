import React from "react";
import type { CoverageGatesPayload } from "../../types";
import { formatPercent } from "../../utils/governance.format";
import { GateStatusBadge } from "./GateStatusBadge";

interface Props {
  data: CoverageGatesPayload | null;
}

export function CoverageGatesTable({ data }: Props) {
  if (!data) return null;

  const rows = [
    { key: "Missing accounts", value: data.gates.missing_accounts.value, status: data.gates.missing_accounts.status },
    { key: "Missing days", value: data.gates.missing_days.value, status: data.gates.missing_days.status },
    { key: "Duplicates", value: data.gates.duplicates.value, status: data.gates.duplicates.status },
    { key: "Late arriving", value: data.gates.late_arriving.value, status: data.gates.late_arriving.status },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">Coverage Gates Table</h3>
      <div className="mt-3 overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.08em] text-slate-600">
            <tr>
              <th className="px-3 py-2">Gate</th>
              <th className="px-3 py-2 text-right">Value</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-3 py-2 font-semibold text-slate-800">{row.key}</td>
                <td className="px-3 py-2 text-right">{row.value}</td>
                <td className="px-3 py-2"><GateStatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-slate-600">
        Coverage completeness: <span className="font-black">{formatPercent(data.summary.coverage_completeness_pct)}</span> | Accounts ingested: <span className="font-black">{data.summary.ingested_accounts_30d}</span> / {data.summary.expected_accounts}
      </div>

      {data.rows.missing_days.length ? (
        <p className="mt-2 text-xs text-amber-700">Missing days: {data.rows.missing_days.slice(0, 12).join(", ")}{data.rows.missing_days.length > 12 ? " ..." : ""}</p>
      ) : null}
    </section>
  );
}

export default CoverageGatesTable;
