import type { ConfidenceModel, ForecastingBudgetsPayload, KpiStrip } from "../../types";
import { formatCurrency, formatPercent, formatSignedCurrency, formatSignedPercent } from "../../utils/format";
import { Metric } from "../shared/ui";

interface ForecastKpiSectionProps {
  kpi: KpiStrip;
  confidence: ConfidenceModel;
  tracking: ForecastingBudgetsPayload["submodules"]["forecastActualTracking"];
  currency: string;
}

export function ForecastKpiSection({
  kpi,
  confidence,
  tracking,
  currency,
}: ForecastKpiSectionProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
      <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
        Forecasting KPI Strip
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="EOM Forecast (Allocated)"
          value={formatCurrency(kpi.eomForecastAllocatedCost, currency)}
          detail="Expected end-of-period allocated spend"
        />
        <Metric
          label="Forecast Drift"
          value={formatSignedCurrency(kpi.forecastDrift, currency)}
          detail="Current forecast vs previous forecast"
        />
        <Metric
          label="Confidence Band"
          value={formatPercent(confidence.confidenceBandPct)}
          detail="Forecast uncertainty envelope"
        />
        <Metric
          label="MAPE"
          value={tracking.mapePct == null ? "N/A" : formatPercent(tracking.mapePct)}
          detail="Forecast accuracy trend"
        />
        <Metric
          label="Bias"
          value={tracking.biasPct == null ? "N/A" : formatSignedPercent(tracking.biasPct)}
          detail="Positive means over-forecasting"
        />
      </div>
    </section>
  );
}
