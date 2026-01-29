import { useMemo } from "react";

export const useClientSideGrouping = ({ data, groupByCol, allColumns }) => {
  return useMemo(() => {
    if (!groupByCol || !Array.isArray(data) || data.length === 0) return [];

    // detect cost col
    const candidates = ["BilledCost", "EffectiveCost", "ListCost", "ContractedCost"];
    let costCol = candidates.find((c) => allColumns?.includes(c) && data?.[0]?.[c] !== undefined);

    if (!costCol && data[0]) {
      for (const key in data[0]) {
        const v = data[0][key];
        const n = parseFloat(v);
        if ((typeof v === "number" || (!isNaN(n) && isFinite(n)))) {
          costCol = key;
          break;
        }
      }
    }

    const groups = {};
    let grandTotalCost = 0;

    data.forEach((row) => {
      const rawKey = row?.[groupByCol];
      const key =
        rawKey !== null && rawKey !== undefined && rawKey !== "" ? String(rawKey) : "(Empty)";

      if (!groups[key]) {
        groups[key] = { name: key, rawValue: rawKey, count: 0, totalCost: 0 };
      }

      const costValue = costCol ? row?.[costCol] : 0;
      const cost = parseFloat(costValue) || 0;

      groups[key].count += 1;
      groups[key].totalCost += cost;
      grandTotalCost += cost;
    });

    return Object.values(groups)
      .map((g) => ({
        ...g,
        percent: grandTotalCost ? (g.totalCost / grandTotalCost) * 100 : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [data, groupByCol, allColumns]);
};
