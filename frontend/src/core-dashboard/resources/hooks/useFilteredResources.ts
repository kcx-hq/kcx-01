import { useMemo } from 'react';
import type { ResourceItem, UseFilteredResourcesParams } from "../types";

export function useFilteredResources({ inventory, searchTerm, activeTab }: UseFilteredResourcesParams) {
  return useMemo(() => {
    return inventory.filter((item: ResourceItem) => {
      if (searchTerm && searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const toStr = (v: unknown) =>
          v === null || v === undefined ? 'null' : String(v).toLowerCase();

        const matches =
          toStr(item.id).includes(q) ||
          toStr(item.service).includes(q) ||
          toStr(item.region).includes(q) ||
          toStr(item.status).includes(q) ||
          (item.totalCost != null ? item.totalCost.toString() : 'null').includes(q);

        if (!matches) return false;
      }

      if (activeTab === 'untagged' && item.hasTags) return false;
      if (activeTab === 'spiking' && item.status !== 'Spiking') return false;

      // NOTE: your original "zombie" tab uses a different view (Cleanup).
      return true;
    });
  }, [inventory, searchTerm, activeTab]);
}



