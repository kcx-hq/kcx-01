import { useMemo } from 'react';

export function useGroupedResources({ filteredData, grouping }) {
  return useMemo(() => {
    const groups = {};
    if (grouping === 'none') return groups;

    filteredData.forEach((item) => {
      const key = grouping === 'service' ? item.service : item.region;
      if (!groups[key]) groups[key] = { items: [], total: 0 };
      groups[key].items.push(item);
      groups[key].total += item.totalCost || 0;
    });

    return groups;
  }, [filteredData, grouping]);
}
