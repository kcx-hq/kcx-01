import { useMemo } from 'react';
import type { GroupedResources, ResourceItem, UseGroupedResourcesParams } from "../types";

export function useGroupedResources({ filteredData, grouping }: UseGroupedResourcesParams) {
  return useMemo(() => {
    const groups: GroupedResources = {};
    if (grouping === 'none') return groups;

    filteredData.forEach((item: ResourceItem) => {
      const key = grouping === 'service' ? item.service : item.region;
      const normalizedKey = String(key);
      if (!groups[normalizedKey]) groups[normalizedKey] = { items: [], total: 0 };
      groups[normalizedKey].items.push(item);
      groups[normalizedKey].total += item.totalCost || 0;
    });

    return groups;
  }, [filteredData, grouping]);
}



