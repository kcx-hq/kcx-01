import { useEffect, useState } from 'react';
import { hasEndpoint } from '../utils/capsUtils';

export const useAnomalies = ({ api, caps, filters, skip }) => {
  const [data, setData] = useState({ list: [], count: 0 });

  useEffect(() => {
    if (!api || !caps || skip) return;
    if (!hasEndpoint(caps, 'overview', 'anomalies')) return;

    api.call('overview', 'anomalies', { params: filters })
      .then(res => setData(res?.data || data))
      .catch(() => {});
  }, [api, caps, filters, skip]);

  return data;
};
