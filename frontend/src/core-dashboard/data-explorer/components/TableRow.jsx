import React, { memo } from "react";

const TableRow = memo(
  ({
    row,
    rIdx,
    globalIndex,
    isSelected,
    visibleColumns,
    columnMaxValues,
    showDataBars,
    getRowHeight,
    onSelect,
    onRowClick,
  }) => {
    const rowHeight = getRowHeight();

    return (
      <tr
        className={`border-b border-white/5 transition-colors ${
          isSelected
            ? "bg-[#a02ff1]/20"
            : rIdx % 2 === 0
            ? "bg-[#1a1b20]"
            : "bg-[#0f0f11] hover:bg-white/5"
        }`}
      >
        <td className="sticky left-0 z-20 bg-inherit border-r border-white/10 text-center px-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="rounded border-gray-600 bg-black/40 accent-[#a02ff1]"
          />
        </td>

        {visibleColumns.map((col, cIdx) => {
          const isCost =
            col.toLowerCase().includes("cost") || col.toLowerCase().includes("price");
          const val = row?.[col];
          const numVal = parseFloat(val);
          const maxVal = columnMaxValues?.[col] || 1;
          const barWidth =
            isCost && !isNaN(numVal) && showDataBars
              ? Math.min(100, Math.abs((numVal / maxVal) * 100))
              : 0;

          return (
            <td
              key={`${globalIndex}-${cIdx}`}
              onClick={onRowClick}
              className={`px-4 ${rowHeight} border-r border-white/5 whitespace-nowrap cursor-pointer relative overflow-hidden ${
                cIdx === 0
                  ? "sticky left-[50px] z-10 shadow-[4px_0_10px_rgba(0,0,0,0.5)] border-r-[#a02ff1]/50 bg-inherit"
                  : ""
              } ${isCost ? "text-right font-mono" : "text-gray-300"}`}
            >
              {barWidth > 0 && (
                <div
                  className="absolute inset-y-0 right-0 bg-[#a02ff1]/20 pointer-events-none"
                  style={{ width: `${barWidth}%` }}
                />
              )}
              <span className="relative z-10">
                {val !== null && val !== undefined
                  ? isCost && !isNaN(numVal)
                    ? numVal.toFixed(4)
                    : String(val)
                  : "-"}
              </span>
            </td>
          );
        })}
      </tr>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.globalIndex === nextProps.globalIndex &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.showDataBars === nextProps.showDataBars &&
      prevProps.visibleColumns.length === nextProps.visibleColumns.length &&
      JSON.stringify(prevProps.row) === JSON.stringify(nextProps.row) &&
      JSON.stringify(prevProps.columnMaxValues) ===
        JSON.stringify(nextProps.columnMaxValues)
    );
  }
);

TableRow.displayName = "TableRow";
export default TableRow;
