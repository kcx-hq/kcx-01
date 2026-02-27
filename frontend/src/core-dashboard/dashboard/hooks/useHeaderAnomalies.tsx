import { useEffect, useState } from 'react';
import { hasEndpoint } from './useDashboardCapabilities';
import type { DashboardAnomaliesData, HeaderAnomaliesParams } from '../types';

export function useHeaderAnomalies({ api, caps, filters, route }: HeaderAnomaliesParams) {
  const [anomaliesData, setAnomaliesData] = useState<DashboardAnomaliesData>({
    list: [],
    count: 0,
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
          const header = (alertsData as { headerAnomalies?: { list?: unknown; count?: unknown } } | null)
            ?.headerAnomalies;
          if (header && typeof header === "object") {
            setAnomaliesData({
              list: Array.isArray(header.list) ? header.list : [],
              count: Number(header.count || 0),
            });
            return;
          }
        }

        if (hasEndpoint(caps, 'overview', 'anomalies')) {
          const overviewData = await api.call<unknown>('overview', 'anomalies', { params });
          if (overviewData && typeof overviewData === "object") {
            setAnomaliesData(overviewData as DashboardAnomaliesData);
          }
        }
      } catch (error) {
        if (error?.code === 'NOT_SUPPORTED') return;
        console.error('Failed to fetch anomalies:', error);
      }
    };

    fetchAnomalies();
  }, [api, caps, filters, route.isDataExplorer, route.isReports]);

  return anomaliesData;
}



