import type { KpiStrip } from "../../types";
import { formatCurrency, formatNullableNumber, formatPercent, formatSignedCurrency, toNumber } from "../../utils/format";
import { Metric } from "../shared/ui";

interface ExecutiveKpiSectionProps {
  kpi: KpiStrip;
  currency: string;
}

export function ExecutiveKpiSection({ kpi, currency }: ExecutiveKpiSectionProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
      <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
        Executive KPI Strip
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="EOM Forecast" value={formatCurrency(kpi.eomForecastAllocatedCost, currency)} detail="Allocated cost landing" />
        <Metric label="Budget Consumption" value={formatPercent(kpi.budgetConsumptionPct)} detail="MTD spend vs budget" />
        <Metric label="Forecast Variance" value={formatSignedCurrency(kpi.budgetVarianceForecast, currency)} detail="Forecast - budget" />
        <Metric label="Burn Rate / Day" value={formatCurrency(kpi.burnRate, currency)} detail="MTD allocated/day" />
        <Metric label="At-Risk Budgets" value={`${toNumber(kpi.atRiskBudgetCount).toFixed(0)}`} detail="Threshold-breach candidates" />
        <Metric label="Breach ETA (days)" value={formatNullableNumber(kpi.breachEtaDays, 1)} detail="At current burn rate" />
        <Metric label="Required Daily Spend" value={formatCurrency(kpi.requiredDailySpend, currency)} detail="To stay in budget" />
        <Metric label="Forecast Drift" value={formatSignedCurrency(kpi.forecastDrift, currency)} detail="Current vs previous forecast" />
        <Metric label="Unit Cost Forecast" value={formatNullableNumber(kpi.unitCostForecast, 6)} detail="Forecast cost / forecast volume" />
        <Metric label="MAPE" value={kpi.mapePct == null ? "N/A" : formatPercent(kpi.mapePct)} detail="Forecast-to-actual accuracy" />
      </div>
    </section>
  );
}

