import { useMemo } from 'react';

export function useFilteredResources({ inventory, searchTerm, activeTab }) {
  return useMemo(() => {
    return inventory.filter((item) => {
      if (searchTerm && searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const toStr = (v) =>
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
