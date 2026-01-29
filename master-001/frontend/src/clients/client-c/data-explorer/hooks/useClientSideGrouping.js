export const useClientSideGrouping = ({ data, groupByCol, allColumns }) => {
  if (!data || !Array.isArray(data) || !groupByCol || !allColumns) {
    return [];
  }

  // Group the data by the specified column
  const groupedMap = {};
  
  data.forEach(row => {
    const groupValue = row[groupByCol];
    const groupKey = groupValue !== undefined && groupValue !== null ? String(groupValue) : 'null';
    
    if (!groupedMap[groupKey]) {
      groupedMap[groupKey] = {
        __group: groupKey,
        __count: 0,
        __rawValue: groupValue,
        __children: []
      };
      
      // Initialize all columns to 0 for accumulation
      allColumns.forEach(col => {
        if (col !== groupByCol) {
          groupedMap[groupKey][col] = 0;
        }
      });
    }
    
    groupedMap[groupKey].__count++;
    groupedMap[groupKey].__children.push(row);
    
    // Accumulate numeric values
    allColumns.forEach(col => {
      if (col !== groupByCol) {
        const val = row[col];
        if (typeof val === 'number') {
          groupedMap[groupKey][col] += val;
        } else if (typeof val === 'string' && !isNaN(parseFloat(val))) {
          groupedMap[groupKey][col] += parseFloat(val);
        }
      }
    });
  });

  return Object.values(groupedMap);
};