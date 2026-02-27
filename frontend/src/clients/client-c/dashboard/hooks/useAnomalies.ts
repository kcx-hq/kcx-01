import { useEffect, useState } from 'react';
import { hasEndpoint } from '../utils/capsUtils';
import type { ApiClient, Capabilities } from '../../../../services/apiClient';

interface AnomalyItem {
  [key: string]: unknown;
}

interface AnomaliesData {
  list: AnomalyItem[];
  count: number;
}

interface UseAnomaliesParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: Record<string, string | undefined>;
  skip?: boolean;
}

export const useAnomalies = ({ api, caps, filters, skip }: UseAnomaliesParams): AnomaliesData => {
  const [data, setData] = useState<AnomaliesData>({ list: [], count: 0 });

  useEffect(() => {
    if (!api || !caps || skip) return;
    if (!hasEndpoint(caps, 'overview', 'anomalies')) return;

    api.call<AnomaliesData>('overview', 'anomalies', { params: filters })
      .then((res) => setData(res || { list: [], count: 0 }))
      .catch(() => {});
  }, [api, caps, filters, skip]);

  return data;
};
