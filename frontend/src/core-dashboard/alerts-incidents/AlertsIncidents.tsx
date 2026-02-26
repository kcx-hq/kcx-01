import { useState } from "react";
import AlertsIncidentsView from "./AlertsIncidentsView";
import { useAlertsIncidentsData } from "./hooks/useAlertsIncidentsData";
import type { AlertsIncidentsControls } from "./types";

interface AlertsIncidentsProps {
  filters: { provider?: string; service?: string; region?: string };
  api: {
    call: (module: string, endpoint: string, options?: { params?: Record<string, unknown> }) => Promise<unknown>;
  } | null;
  caps: { modules?: Record<string, { enabled?: boolean }> } | null;
}

const INITIAL_CONTROLS: AlertsIncidentsControls = {
  period: "mtd",
  costBasis: "actual",
  severity: "",
  type: "",
  status: "",
};

export default function AlertsIncidents({ filters, api, caps }: AlertsIncidentsProps) {
  const [controls, setControls] = useState<AlertsIncidentsControls>(INITIAL_CONTROLS);
  const { loading, refreshing, error, data } = useAlertsIncidentsData({
    api,
    caps,
    filters,
    controls,
  });

  if (!api || !caps?.modules?.alertsIncidents?.enabled) return null;

  const handleControlsChange = (patch: Partial<AlertsIncidentsControls>) =>
    setControls((prev) => ({ ...prev, ...patch }));

  return (
    <AlertsIncidentsView
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
