import { useEffect, useMemo, useState } from "react";
import type { AlertsIncidentsControls, AlertsIncidentsPayload } from "../types";

const EMPTY_DATA: AlertsIncidentsPayload = {
  controls: { period: "mtd", costBasis: "actual", currency: "USD" },
  kpis: {
    totalOpenAlerts: 0,
    criticalAlerts: 0,
    highAlerts: 0,
    unresolvedSlaBreaches: 0,
    totalImpact: 0,
    confidenceLowCount: 0,
    advisoryOnlyCount: 0,
  },
  alerts: [],
  incidentBundles: [],
  embeddedViews: {},
  notificationCenter: {
    policy: {
      realTimeSeverities: ["critical", "high"],
      digestSeverities: ["medium", "low"],
      channels: ["email", "in_app", "enterprise_incident_channel"],
    },
    queue: [],
    totalQueued: 0,
    routedOwners: 0,
  },
  ownershipRouting: {
    source: "allocation_driven",
    primaryOwner: "governance-owner@kcx.example",
    escalationChain: [],
    topTeams: [],
  },
  headerAnomalies: { count: 0, list: [] },
};

export function useAlertsIncidentsData({
  api,
  caps,
  filters,
  controls,
}: {
  api: {
    call: (module: string, endpoint: string, options?: { params?: Record<string, unknown> }) => Promise<unknown>;
  } | null;
  caps: { modules?: Record<string, { enabled?: boolean }> } | null;
  filters: { provider?: string; service?: string; region?: string };
  controls: AlertsIncidentsControls;
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AlertsIncidentsPayload>(EMPTY_DATA);

  const params = useMemo(
    () => ({
      provider: filters?.provider !== "All" ? filters.provider : undefined,
      service: filters?.service !== "All" ? filters.service : undefined,
      region: filters?.region !== "All" ? filters.region : undefined,
      period: controls.period,
      costBasis: controls.costBasis,
      severity: controls.severity || undefined,
      type: controls.type || undefined,
      status: controls.status || undefined,
    }),
    [
      filters?.provider,
      filters?.service,
      filters?.region,
      controls.period,
      controls.costBasis,
      controls.severity,
      controls.type,
      controls.status,
    ],
  );

  useEffect(() => {
    if (!api || !caps?.modules?.alertsIncidents?.enabled) {
      setLoading(false);
      setRefreshing(false);
      setError(null);
      setData(EMPTY_DATA);
      return;
    }

    let active = true;
    setError(null);
    setRefreshing(!loading);

    (async () => {
      try {
        const response = (await api.call("alertsIncidents", "summary", { params })) as AlertsIncidentsPayload | null;
        if (!active) return;
        setData(response || EMPTY_DATA);
      } catch (fetchError) {
        if (!active) return;
        const code = (fetchError as { code?: string })?.code;
        if (code !== "NOT_SUPPORTED") {
          console.error("Alerts & Incidents fetch failed:", fetchError);
          setError("Failed to load Alerts & Incidents.");
        }
        setData(EMPTY_DATA);
      } finally {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [api, caps, params]);

  return { loading, refreshing, error, data };
}

