import { useEffect, useState } from 'react';
import { hasEndpoint } from './useDashboardCapabilities';

export function useHeaderAnomalies({ api, caps, filters, route }) {
  const [anomaliesData, setAnomaliesData] = useState({ list: [], count: 0 });

  useEffect(() => {
    if (!api || !caps) return;
    if (route.isDataExplorer || route.isReports) return;
    if (!hasEndpoint(caps, 'overview', 'anomalies')) return;

    const fetchAnomalies = async () => {
      try {
        const data = await api.call('overview', 'anomalies', {
          params: {
            provider: filters.provider !== 'All' ? filters.provider : undefined,
            service: filters.service !== 'All' ? filters.service : undefined,
            region: filters.region !== 'All' ? filters.region : undefined,
            uploadId: filters.uploadId,
          },
        });

        if (data?.data) setAnomaliesData(data.data);
      } catch (error) {
        if (error?.code === 'NOT_SUPPORTED') return;
        console.error('Failed to fetch anomalies:', error);
      }
    };

    fetchAnomalies();
  }, [api, caps, filters, route.isDataExplorer, route.isReports]);

  return anomaliesData;
}
