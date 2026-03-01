import React from "react";
import type { GateStatus } from "../../types";

const statusClass: Record<GateStatus, string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  fail: "border-rose-200 bg-rose-50 text-rose-700",
};

export function GateStatusBadge({ status }: { status: GateStatus | string }) {
  const key = (String(status || "pass").toLowerCase() as GateStatus);
  const klass = statusClass[key] || statusClass.pass;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${klass}`}>
      {key}
    </span>
  );
}

export default GateStatusBadge;
