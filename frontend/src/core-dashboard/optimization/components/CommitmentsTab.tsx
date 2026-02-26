import React from "react";
import { AlertCircle, Lightbulb } from "lucide-react";
import { formatCurrency } from "../utils/format";

export function CommitmentsTab({ commitmentGap }) {
  if (commitmentGap && typeof commitmentGap === "object") {
    return (
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Commitment Gap & Waste</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Potential Savings</p>
              <p className="mt-1 text-xl font-black text-emerald-700">{formatCurrency(commitmentGap.potentialSavings || 0)}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Recommended Strategy</p>
              <p className="mt-1 text-sm font-black text-slate-900">{commitmentGap.recommendation || "N/A"}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Workload Stability</p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {commitmentGap.predictableWorkload ? "Predictable baseline" : "Variable baseline"}
              </p>
            </article>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="max-w-md rounded-xl border border-[var(--border-light)] bg-white p-10 text-center">
        <AlertCircle size={64} className="mx-auto mb-6 text-[var(--brand-primary)]" />
        <h3 className="mb-3 text-2xl font-bold text-[var(--text-primary)]">Coming Soon</h3>
        <p className="mb-6 text-[var(--text-muted)]">
          Commitment analysis and Reserved Instance recommendations will be available soon.
          This feature will help you identify opportunities for Savings Plans and Reserved Instances.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
          <Lightbulb size={16} />
          <span>Stay tuned for updates.</span>
        </div>
      </div>
    </div>
  );
}

export default CommitmentsTab;

