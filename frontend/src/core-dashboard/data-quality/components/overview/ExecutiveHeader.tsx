import { ShieldCheck } from "lucide-react";
import type { ConfidenceLevel } from "../../types";
import { confidenceLabel } from "./overview.models";

interface ExecutiveHeaderProps {
  confidenceLevel?: ConfidenceLevel | string;
}

export const ExecutiveHeader = ({ confidenceLevel }: ExecutiveHeaderProps) => (
  <div className="core-panel">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2">
          <ShieldCheck size={18} className="text-[var(--brand-primary)]" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight md:text-xl">Governance & Data Quality</h1>
          <p className="text-xs text-[var(--text-muted)] md:text-sm">Trust, policy, ownership, and data readiness.</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Executive confidence</p>
        <p className="text-sm font-black text-slate-800">{confidenceLabel(confidenceLevel)}</p>
      </div>
    </div>
  </div>
);
