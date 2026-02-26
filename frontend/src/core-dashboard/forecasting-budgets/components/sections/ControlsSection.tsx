import { SectionRefreshOverlay } from "../../../common/SectionStates";
import type { ForecastingControls } from "../../types";
import { SelectField } from "../shared/ui";

interface ControlsSectionProps {
  controls: ForecastingControls;
  onControlsChange: (patch: Partial<ForecastingControls>) => void;
  refreshing: boolean;
}

export function ControlsSection({
  controls,
  onControlsChange,
  refreshing,
}: ControlsSectionProps) {
  return (
    <section className="relative rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
      {refreshing ? <SectionRefreshOverlay rounded="rounded-2xl" label="Refreshing forecasts..." /> : null}
      <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
        Controls
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SelectField
          label="Period"
          value={controls.period}
          onChange={(value) => onControlsChange({ period: value as ForecastingControls["period"] })}
          options={[
            { value: "mtd", label: "MTD" },
            { value: "qtd", label: "QTD" },
            { value: "30d", label: "Last 30d" },
            { value: "90d", label: "Last 90d" },
          ]}
        />
        <SelectField
          label="Compare To"
          value={controls.compareTo}
          onChange={(value) =>
            onControlsChange({ compareTo: value as ForecastingControls["compareTo"] })
          }
          options={[
            { value: "previous_period", label: "Previous Period" },
            { value: "same_period_last_month", label: "Same Period Last Month" },
            { value: "none", label: "None" },
          ]}
        />
        <SelectField
          label="Cost Basis"
          value={controls.costBasis}
          onChange={(value) => onControlsChange({ costBasis: value as ForecastingControls["costBasis"] })}
          options={[
            { value: "actual", label: "Actual" },
            { value: "amortized", label: "Amortized" },
            { value: "net", label: "Net" },
          ]}
        />
      </div>
    </section>
  );
}

