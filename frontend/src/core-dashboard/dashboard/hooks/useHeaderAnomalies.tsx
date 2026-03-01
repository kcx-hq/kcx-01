import { useEffect, useState } from 'react';
import { hasEndpoint } from './useDashboardCapabilities';
import type {
  DashboardHeaderAlert,
  DashboardHeaderData,
  DashboardHeaderAlertsData,
  HeaderAnomaliesParams,
} from '../types';

const EMPTY_ALERTS: DashboardHeaderAlertsData = {
  totalOpenAlerts: 0,
  categories: [],
  topByCategory: {},
  topAlerts: [],
  currency: "USD",
};

const toSeverity = (value: unknown): "critical" | "high" | "medium" | "low" => {
  const v = String(value || "").toLowerCase();
  if (v === "critical" || v === "high" || v === "medium") return v;
  return "low";
};

const sanitizeAlert = (alert: unknown): DashboardHeaderAlert | null => {
  if (!alert || typeof alert !== "object") return null;
  const raw = alert as Record<string, unknown>;

  return {
    id: String(raw.id || ""),
    title: String(raw.title || "Alert"),
    category: String(raw.category || "spend"),
    type: String(raw.type || "unknown"),
    subtype: String(raw.subtype || "unknown"),
    severity: toSeverity(raw.severity),
    status: String(raw.status || "new"),
    detectedAt: String(raw.detectedAt || ""),
    deepLink: String(raw.deepLink || "/dashboard/alerts-incidents"),
    scope: {
      provider: String((raw.scope as Record<string, unknown> | undefined)?.provider || "All"),
      service: String((raw.scope as Record<string, unknown> | undefined)?.service || "All"),
      region: String((raw.scope as Record<string, unknown> | undefined)?.region || "All"),
      team: String((raw.scope as Record<string, unknown> | undefined)?.team || "Unassigned"),
    },
    impact: {
      amount: Number((raw.impact as Record<string, unknown> | undefined)?.amount || 0),
      pct: Number((raw.impact as Record<string, unknown> | undefined)?.pct || 0),
      currency: String((raw.impact as Record<string, unknown> | undefined)?.currency || "USD"),
    },
    nextStep: String(raw.nextStep || "Open alert details for remediation steps."),
  };
};

export function useHeaderAnomalies({ api, caps, filters, route }: HeaderAnomaliesParams) {
  const [headerData, setHeaderData] = useState<DashboardHeaderData>({
    anomalies: { list: [], count: 0 },
    alerts: EMPTY_ALERTS,
  });

  useEffect(() => {
    if (!api || !caps) return;
    if (route.isDataExplorer || route.isReports) return;

    const fetchAnomalies = async () => {
      try {
        const params = {
          provider: filters.provider !== 'All' ? filters.provider : undefined,
          service: filters.service !== 'All' ? filters.service : undefined,
          region: filters.region !== 'All' ? filters.region : undefined,
          uploadId: filters.uploadId,
        };

        if (hasEndpoint(caps, 'alertsIncidents', 'summary')) {
          const alertsData = await api.call<unknown>('alertsIncidents', 'summary', {
            params: { ...params, view: "header" },
          });
          const response = alertsData as {
            headerAlerts?: {
              totalOpenAlerts?: unknown;
              categories?: unknown;
              topByCategory?: unknown;
              topAlerts?: unknown;
              currency?: unknown;
            };
            headerAnomalies?: { list?: unknown; count?: unknown };
          } | null;

          const header = response
            ?.headerAnomalies;
          const headerAlerts = response?.headerAlerts;

          const categories = Array.isArray(headerAlerts?.categories)
            ? headerAlerts.categories
                .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
                .map((item) => ({
                  id: String(item.id || "unknown"),
                  label: String(item.label || "Unknown"),
                  count: Number(item.count || 0),
                }))
            : [];

          const topAlerts = Array.isArray(headerAlerts?.topAlerts)
            ? headerAlerts.topAlerts.map(sanitizeAlert).filter((item): item is DashboardHeaderAlert => Boolean(item))
            : [];

          const topByCategoryRaw = headerAlerts?.topByCategory;
          const topByCategory =
            topByCategoryRaw && typeof topByCategoryRaw === "object"
              ? Object.fromEntries(
                  Object.entries(topByCategoryRaw as Record<string, unknown>).map(([key, value]) => [
                    key,
                    Array.isArray(value)
                      ? value.map(sanitizeAlert).filter((item): item is DashboardHeaderAlert => Boolean(item))
                      : [],
                  ]),
                )
              : {};

          if (header && typeof header === "object") {
            setHeaderData({
              anomalies: {
                list: Array.isArray(header.list) ? header.list : [],
                count: Number(header.count || 0),
              },
              alerts: {
                totalOpenAlerts: Number(headerAlerts?.totalOpenAlerts || 0),
                categories,
                topByCategory,
                topAlerts,
                currency: String(headerAlerts?.currency || "USD"),
              },
            });
            return;
          }
        }

        if (hasEndpoint(caps, 'overview', 'anomalies')) {
          const overviewData = await api.call<unknown>('overview', 'anomalies', { params });
          if (overviewData && typeof overviewData === "object") {
            const parsed = overviewData as { list?: unknown; count?: unknown };
            setHeaderData({
              anomalies: {
                list: Array.isArray(parsed?.list) ? parsed.list : [],
                count: Number(parsed?.count || 0),
              },
              alerts: EMPTY_ALERTS,
            });
          }
        }
      } catch (error) {
        if (error?.code === 'NOT_SUPPORTED') return;
        console.error('Failed to fetch anomalies:', error);
      }
    };

    fetchAnomalies();
  }, [api, caps, filters, route.isDataExplorer, route.isReports]);

  return headerData;
}



