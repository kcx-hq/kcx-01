import React from "react";
import type { BannerSeverity } from "../../types";

const severityClass: Record<BannerSeverity, string> = {
  critical: "border-rose-300 bg-rose-100 text-rose-800",
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function SeverityChip({ severity }: { severity: BannerSeverity | string }) {
  const key = (String(severity || "low").toLowerCase() as BannerSeverity);
  const klass = severityClass[key] || severityClass.low;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${klass}`}>
      {key}
    </span>
  );
}

export default SeverityChip;
