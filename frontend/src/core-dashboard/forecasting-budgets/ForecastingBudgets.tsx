import { useState } from "react";
import ForecastingBudgetsView from "./ForecastingBudgetsView";
import { useForecastingBudgetsData } from "./hooks/useForecastingBudgetsData";
import type { ForecastingControls } from "./types";

interface ForecastingBudgetsProps {
  filters: { provider?: string; service?: string; region?: string };
  api: { call: (module: string, endpoint: string, options?: { params?: Record<string, unknown> }) => Promise<unknown> } | null;
  caps: { modules?: Record<string, { enabled?: boolean }> } | null;
}

const INITIAL_CONTROLS: ForecastingControls = {
  period: "mtd",
  compareTo: "previous_period",
  costBasis: "actual",
};

export default function ForecastingBudgets({ filters, api, caps }: ForecastingBudgetsProps) {
  if (!api || !caps?.modules?.forecastingBudgets?.enabled) return null;

  const [controls, setControls] = useState<ForecastingControls>(INITIAL_CONTROLS);
  const { loading, refreshing, error, data } = useForecastingBudgetsData({
    api,
    caps,
    filters,
    controls,
  });

  const handleControlsChange = (patch: Partial<ForecastingControls>) =>
    setControls((prev) => ({ ...prev, ...patch }));

  return (
    <ForecastingBudgetsView
      loading={loading}
      refreshing={refreshing}
      error={error}
      data={data}
      controls={controls}
      onControlsChange={handleControlsChange}
      filters={filters}
    />
  );
}

