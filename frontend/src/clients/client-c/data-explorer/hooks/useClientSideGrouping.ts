import type { ClientCGroupedRow, DataExplorerRow } from "../types";

interface UseClientSideGroupingParams {
  data: DataExplorerRow[];
  groupByCol: string | null;
  allColumns: string[];
}

export const useClientSideGrouping = ({ data, groupByCol, allColumns }: UseClientSideGroupingParams): ClientCGroupedRow[] => {
  if (!data || !Array.isArray(data) || !groupByCol || !allColumns) {
    return [];
  }

  // Group the data by the specified column
  const groupedMap: Record<string, ClientCGroupedRow> = {};
  
  data.forEach((row: DataExplorerRow) => {
    const groupValue = row[groupByCol];
    const groupKey = groupValue !== undefined && groupValue !== null ? String(groupValue) : 'null';
    
    if (!groupedMap[groupKey]) {
      groupedMap[groupKey] = {
        __group: groupKey,
        __count: 0,
        __rawValue: groupValue,
        __children: []
      };
      const newGroup = groupedMap[groupKey];
      if (!newGroup) return;
      
      // Initialize all columns to 0 for accumulation
      allColumns.forEach((col: string) => {
        if (col !== groupByCol) {
          newGroup[col] = 0 as unknown;
        }
      });
    }
    const group = groupedMap[groupKey];
    if (!group) return;
    
    group.__count++;
    group.__children.push(row);
    
    // Accumulate numeric values
    allColumns.forEach((col: string) => {
      if (col !== groupByCol) {
        const val = row[col];
        if (typeof val === 'number') {
          const current = Number(group[col] ?? 0);
          group[col] = current + val;
        } else if (typeof val === 'string' && !isNaN(parseFloat(val))) {
          const current = Number(group[col] ?? 0);
          group[col] = current + parseFloat(val);
        }
      }
    });
  });

  return Object.values(groupedMap);
};
