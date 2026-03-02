import { useState } from "react";
import ForecastingBudgetsView from "./ForecastingBudgetsView";
import { useForecastingBudgetsData } from "./hooks/useForecastingBudgetsData";
import type { ForecastingControls } from "./types";

interface ForecastingBudgetsProps {
  filters: { provider?: string; service?: string; region?: string };
  api: {
    call: (
      module: string,
      endpoint: string,
      options?: { params?: Record<string, unknown>; data?: unknown },
    ) => Promise<unknown>;
  } | null;
  caps: { modules?: Record<string, { enabled?: boolean }> } | null;
}

const CURRENT_MONTH_LABEL =
  new Date().toLocaleString("en-US", { month: "long" }) || "January";

const INITIAL_CONTROLS: ForecastingControls = {
  period: "mtd",
  compareTo: "previous_period",
  costBasis: "actual",
  budgetMonth: CURRENT_MONTH_LABEL,
};

export default function ForecastingBudgets({ filters, api, caps }: ForecastingBudgetsProps) {
  const isEnabled = Boolean(api && caps?.modules?.forecastingBudgets?.enabled);

  const [controls, setControls] = useState<ForecastingControls>(INITIAL_CONTROLS);
  const { loading, refreshing, error, data, reload } = useForecastingBudgetsData({
    api,
    caps,
    filters,
    controls,
  });

  const handleControlsChange = (patch: Partial<ForecastingControls>) =>
    setControls((prev) => ({ ...prev, ...patch }));

  if (!isEnabled) return null;

  return (
    <ForecastingBudgetsView
      loading={loading}
      refreshing={refreshing}
      error={error}
      data={data}
      controls={controls}
      onControlsChange={handleControlsChange}
      filters={filters}
      api={api}
      onBudgetSaved={reload}
    />
  );
}
