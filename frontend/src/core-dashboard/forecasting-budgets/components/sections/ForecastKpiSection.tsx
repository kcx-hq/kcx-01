import type { ConfidenceModel, ForecastView, KpiStrip } from "../../types";
import { formatCurrency, formatSignedCurrency, formatSignedPercent, toNumber } from "../../utils/format";
import { Metric } from "../shared/ui";

interface ForecastKpiSectionProps {
  kpi: KpiStrip;
  confidence: ConfidenceModel;
  forecastView?: ForecastView;
  currency: string;
}

export function ForecastKpiSection({
  kpi,
  confidence,
  forecastView,
  currency,
}: ForecastKpiSectionProps) {
  const driftValue = toNumber(forecastView?.kpi?.driftValue ?? kpi.forecastDrift);
  const driftPct = toNumber(forecastView?.kpi?.driftPct ?? kpi.forecastDriftPct ?? 0);
  const runRate = toNumber(forecastView?.kpi?.runRatePerDay ?? kpi.burnRate);
  const confidenceLevel = String(
    forecastView?.kpi?.confidenceLevel || confidence.forecastConfidence.level || "low"
  ).toLowerCase();
  const confidenceScore = toNumber(
    forecastView?.kpi?.confidenceScore ?? confidence.forecastConfidence.score
  );

  const confidenceCls =
    confidenceLevel === "high"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : confidenceLevel === "medium"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <section className="rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
          Forecast KPI Strip
        </h2>
        <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${confidenceCls}`}>
          {confidenceLevel} confidence ({confidenceScore.toFixed(1)})
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="EOM Forecast"
          value={formatCurrency(kpi.eomForecastAllocatedCost, currency)}
          detail="Predicted month-end allocated spend"
        />
        <Metric
          label="Forecast vs Last Forecast"
          value={`${formatSignedCurrency(driftValue, currency)} (${formatSignedPercent(driftPct)})`}
          detail="Drift compared with previous forecast snapshot"
        />
        <Metric
          label="Run-Rate Used"
          value={formatCurrency(runRate, currency)}
          detail="Daily cost used by the forecasting model"
        />
        <Metric label="Forecast Confidence" value={confidenceLevel.toUpperCase()} detail="Gate-derived confidence level" />
      </div>
    </section>
  );
}
