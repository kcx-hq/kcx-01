import React from "react";
import type { QualityImpactBannerPayload } from "../../types";
import { formatDateTime } from "../../utils/governance.format";
import { GateStatusBadge } from "./GateStatusBadge";
import { SeverityChip } from "./SeverityChip";

interface Props {
  banner: QualityImpactBannerPayload | null;
}

export function QualityImpactBanner({ banner }: Props) {
  if (!banner) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">Quality impact banner</p>
          <h2 className="mt-1 text-base font-black text-slate-900">Trust Status</h2>
          <p className="mt-1 text-sm text-slate-700">{banner.message}</p>
          <p className="mt-1 text-[11px] text-slate-500">Last checked: {formatDateTime(banner.last_checked_ts)}</p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityChip severity={banner.severity} />
          <GateStatusBadge status={banner.overall_status} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(banner.impact_scope_chips || []).map((chip) => (
          <span
            key={chip}
            className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {(banner.gate_summaries || []).map((gate) => (
          <article key={gate.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black text-slate-800">{gate.label}</p>
              <GateStatusBadge status={gate.severity} />
            </div>
            <p className="mt-1 text-[11px] text-slate-600">{gate.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default QualityImpactBanner;
