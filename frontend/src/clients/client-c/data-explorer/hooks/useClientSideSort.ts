import type { DataExplorerRow, DataExplorerSortConfig } from "../types";

interface UseClientSideSortParams {
  data: DataExplorerRow[];
  sortConfig: DataExplorerSortConfig;
}

export const useClientSideSort = ({ data, sortConfig }: UseClientSideSortParams): DataExplorerRow[] => {
  if (!data || !Array.isArray(data) || !sortConfig || !sortConfig.key) {
    return data || [];
  }

  const { key, direction } = sortConfig;
  
  return [...data].sort((a: DataExplorerRow, b: DataExplorerRow) => {
    const aVal = a[key];
    const bVal = b[key];
    
    // Handle null/undefined values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return direction === 'asc' ? 1 : -1;
    if (bVal == null) return direction === 'asc' ? -1 : 1;
    
    // Handle numeric values
    const aNum = Number(aVal);
    const bNum = Number(bVal);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    }
    
    // Handle string values
    const strA = String(aVal).toLowerCase();
    const strB = String(bVal).toLowerCase();
    
    if (strA < strB) return direction === 'asc' ? -1 : 1;
    if (strA > strB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};
