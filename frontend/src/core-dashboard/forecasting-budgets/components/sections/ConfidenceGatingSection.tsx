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
        Confidence Gating Model
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

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
            <tr>
              <th className="px-3 py-2">Gate</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Value</th>
              <th className="px-3 py-2">Threshold</th>
              <th className="px-3 py-2">Consequence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(confidence.gates || []).map((gate) => (
              <tr key={gate.id}>
                <td className="px-3 py-2 font-semibold text-slate-900">{gate.label}</td>
                <td className="px-3 py-2">
                  <StatusPill status={gate.status} />
                </td>
                <td className="px-3 py-2 text-slate-700">{gate.value.toFixed(2)}</td>
                <td className="px-3 py-2 text-slate-700">{gate.threshold}</td>
                <td className="px-3 py-2 text-slate-700">{gate.consequence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

