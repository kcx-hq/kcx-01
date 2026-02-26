import { useEffect, useState } from 'react';
import { hasEndpoint } from './useDashboardCapabilities';

export function useHeaderAnomalies({ api, caps, filters, route }) {
  const [anomaliesData, setAnomaliesData] = useState({ list: [], count: 0 });

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
          const alertsData = await api.call('alertsIncidents', 'summary', {
            params: { ...params, view: "header" },
          });
          const header = alertsData?.data?.headerAnomalies;
          if (header) {
            setAnomaliesData({
              list: Array.isArray(header.list) ? header.list : [],
              count: Number(header.count || 0),
            });
            return;
          }
        }

        if (hasEndpoint(caps, 'overview', 'anomalies')) {
          const overviewData = await api.call('overview', 'anomalies', { params });
          if (overviewData?.data) setAnomaliesData(overviewData.data);
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
