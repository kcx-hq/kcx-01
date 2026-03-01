import { ShieldCheck } from "lucide-react";
import type { ConfidenceModel } from "../../types";
import { formatPercent } from "../../utils/format";
import { Metric, StatusPill } from "../shared/ui";

interface ConfidenceGatingSectionProps {
  confidence: ConfidenceModel;
}

export function ConfidenceGatingSection({ confidence }: ConfidenceGatingSectionProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
      <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
        <ShieldCheck size={16} className="text-[var(--brand-primary)]" />
        Confidence Gates (Governance Inputs)
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric
          label="Forecast Confidence"
          value={`${confidence.forecastConfidence.score.toFixed(2)} (${confidence.forecastConfidence.level.toUpperCase()})`}
          detail={confidence.forecastConfidence.advisoryOnly ? "Advisory only" : "Decisionable"}
        />
        <Metric
          label="Budget Confidence"
          value={`${confidence.budgetConfidence.score.toFixed(2)} (${confidence.budgetConfidence.level.toUpperCase()})`}
          detail={confidence.budgetConfidence.advisoryOnly ? "Advisory only" : "Control-ready"}
        />
        <Metric
          label="Confidence Band"
          value={formatPercent(confidence.confidenceBandPct)}
          detail="Derived from volatility + governance gates"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        {(confidence.gates || []).map((gate) => (
          <article
            key={gate.id}
            className={`rounded-xl border p-3 ${
              gate.status === "pass"
                ? "border-emerald-200 bg-emerald-50/60"
                : gate.status === "warn"
                  ? "border-amber-200 bg-amber-50/60"
                  : "border-rose-200 bg-rose-50/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">{gate.label}</p>
              <StatusPill status={gate.status} />
            </div>
            <p className="mt-2 text-xl font-black text-slate-900">{gate.value.toFixed(2)}</p>
            <p className="mt-1 text-xs text-slate-700">Threshold: {gate.threshold}</p>
            <p className="mt-2 text-xs text-slate-600">{gate.consequence}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
          Gate Impact Summary
        </p>
        <p className="mt-1 text-sm text-slate-700">
          {confidence.consequences.length
            ? confidence.consequences.join(" ")
            : "All governance gates are passing for current planning confidence."}
        </p>
      </div>
    </section>
  );
}

