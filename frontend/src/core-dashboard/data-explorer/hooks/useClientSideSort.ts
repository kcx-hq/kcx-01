import { useMemo } from "react";

export const useClientSideSort = ({ data, sortConfig }) => {
  return useMemo(() => {
    const raw = Array.isArray(data) ? data : [];
    if (!sortConfig?.key) return raw;

    const key = sortConfig.key;
    const dir = sortConfig.direction === "desc" ? "desc" : "asc";

    return [...raw].sort((a, b) => {
      const aVal = a?.[key];
      const bVal = b?.[key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      const isNumeric = !isNaN(aNum) && !isNaN(bNum) && isFinite(aNum) && isFinite(bNum);

      if (isNumeric) return dir === "asc" ? aNum - bNum : bNum - aNum;

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr === bStr) return 0;
      return dir === "asc" ? (aStr < bStr ? -1 : 1) : (aStr > bStr ? -1 : 1);
    });
  }, [data, sortConfig]);
};
