import type { KpiStrip } from "../../types";
import { formatCurrency, formatNullableNumber, formatPercent, formatSignedCurrency } from "../../utils/format";
import { Metric } from "../shared/ui";

interface ExecutiveKpiSectionProps {
  kpi: KpiStrip;
  currency: string;
}

export function ExecutiveKpiSection({ kpi, currency }: ExecutiveKpiSectionProps) {
  const breachEtaValue =
    kpi.breachEtaDays == null ? "N/A" : `${formatNullableNumber(kpi.breachEtaDays, 1)} days`;

  return (
    <section className="rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
      <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
        Budget Outcomes KPI Strip
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="EOM Forecast (Allocated)"
          value={formatCurrency(kpi.eomForecastAllocatedCost, currency)}
          detail="Expected end-of-period allocated spend"
        />
        <Metric
          label="Budget Burn %"
          value={formatPercent(kpi.budgetConsumptionPct)}
          detail="Current consumption against total budget"
        />
        <Metric label="Breach ETA" value={breachEtaValue} detail="Days until breach at current burn" />
        <Metric
          label="Required Daily Spend"
          value={formatCurrency(kpi.requiredDailySpend, currency)}
          detail="Daily target to land inside budget"
        />
        <Metric
          label="Forecast Drift"
          value={formatSignedCurrency(kpi.forecastDrift, currency)}
          detail="Change from previous forecast snapshot"
        />
      </div>
    </section>
  );
}

