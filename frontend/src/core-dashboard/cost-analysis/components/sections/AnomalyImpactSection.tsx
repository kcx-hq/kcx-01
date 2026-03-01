import React from "react";
import { AlertTriangle } from "lucide-react";
import type { SpendAnalyticsPayload } from "../../types";
import { formatCurrency, formatDate } from "../../utils/format";

interface AnomalyImpactSectionProps {
  anomalyImpact: SpendAnalyticsPayload["anomalyImpact"];
}

const severityClassMap: Record<string, string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-700",
};

const AnomalyImpactSection = ({ anomalyImpact }: AnomalyImpactSectionProps) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-rose-600" />
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Anomaly Impact</h2>
      </div>
      <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">
        Total impact {formatCurrency(anomalyImpact.impactTotal)} ({anomalyImpact.shareOfSpend.toFixed(2)}%)
      </span>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {anomalyImpact.cards.slice(0, 3).map((card) => (
        <div key={card.id} className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
          <p className="text-sm font-bold text-slate-800">{card.title}</p>
          <p className="mt-2 text-lg font-black text-slate-900">{formatCurrency(card.impactToDate)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
              {card.confidence} confidence
            </span>
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                severityClassMap[card.severity] || "bg-slate-100 text-slate-700"
              }`}
            >
              {card.severity}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-600">Window: {formatDate(card.windowStart)} to {formatDate(card.windowEnd)}</p>
          <p className="mt-1 text-[11px] text-slate-600">Likely drivers: {card.likelyDrivers.join(", ") || "N/A"}</p>
        </div>
      ))}
    </div>
  </section>
);

export default AnomalyImpactSection;
