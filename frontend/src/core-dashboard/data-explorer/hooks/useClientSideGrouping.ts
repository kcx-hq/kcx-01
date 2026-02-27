import { useMemo } from "react";
import type { DataExplorerGroupedItem, DataExplorerRow, UseClientSideGroupingParams } from "../types";

export const useClientSideGrouping = ({
  data,
  groupByCol,
  allColumns,
}: UseClientSideGroupingParams): DataExplorerGroupedItem[] => {
  return useMemo<DataExplorerGroupedItem[]>(() => {
    if (!groupByCol || !Array.isArray(data) || data.length === 0) return [];

    // detect cost col
    const candidates = ["BilledCost", "EffectiveCost", "ListCost", "ContractedCost"];
    let costCol = candidates.find((c: string) => allColumns?.includes(c) && data?.[0]?.[c] !== undefined);

    if (!costCol && data[0]) {
      for (const key in data[0]) {
        const v = data[0][key];
        const n = parseFloat(String(v));
        if ((typeof v === "number" || (!isNaN(n) && isFinite(n)))) {
          costCol = key;
          break;
        }
      }
    }

    const groups: Record<string, DataExplorerGroupedItem> = {};
    let grandTotalCost = 0;

    data.forEach((row: DataExplorerRow) => {
      const rawKey = row?.[groupByCol] as string | number | boolean | null | undefined;
      const key =
        rawKey !== null && rawKey !== undefined && rawKey !== "" ? String(rawKey) : "(Empty)";

      if (!groups[key]) {
        groups[key] = { name: key, rawValue: rawKey, count: 0, totalCost: 0, percent: 0 };
      }

      const costValue = costCol ? row?.[costCol] : 0;
      const cost = parseFloat(String(costValue)) || 0;

      const bucket = groups[key]!;
      bucket.count += 1;
      bucket.totalCost += cost;
      grandTotalCost += cost;
    });

    return Object.values(groups)
      .map((g: DataExplorerGroupedItem) => ({
        ...g,
        percent: grandTotalCost ? (g.totalCost / grandTotalCost) * 100 : 0,
      }))
      .sort((a: DataExplorerGroupedItem, b: DataExplorerGroupedItem) => b.totalCost - a.totalCost);
  }, [data, groupByCol, allColumns]);
};



