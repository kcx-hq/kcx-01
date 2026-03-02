import React, { memo } from "react";
import type { DataExplorerRow, TableRowProps } from "../types";

// KCX Brand Primary
const BRAND_EMERALD = "#23a282";

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
  }: TableRowProps) => {
    const rowHeight = getRowHeight() || "py-3";

    return (
      <tr
        className={`border-b border-slate-100 transition-all duration-200 group ${
          isSelected
            ? "bg-emerald-50/60"
            : rIdx % 2 === 0
            ? "bg-white"
            : "bg-slate-50/30 hover:bg-slate-50"
        }`}
      >
        {/* Checkbox Column */}
        <td className="sticky left-0 z-20 bg-inherit border-r border-slate-100 text-center px-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4 rounded-md border-slate-300 text-[#23a282] focus:ring-emerald-500 transition-all cursor-pointer"
          />
        </td>

        {visibleColumns.map((col: string, cIdx: number) => {
          const isCost =
            col.toLowerCase().includes("cost") || col.toLowerCase().includes("price");
          const val = row?.[col];
          const numVal = parseFloat(String(val));
          const maxVal = columnMaxValues?.[col] || 1;
          
          // Data Bar calculation (Emerald tint)
          const barWidth =
            isCost && !isNaN(numVal) && showDataBars
              ? Math.min(100, Math.abs((numVal / maxVal) * 100))
              : 0;

          return (
            <td
              key={`${globalIndex}-${cIdx}`}
              onClick={onRowClick}
              className={`px-5 ${rowHeight} border-r border-slate-100 whitespace-nowrap cursor-pointer relative overflow-hidden transition-colors ${
                cIdx === 0
                  ? "sticky left-[60px] z-10 shadow-[4px_0_10px_rgba(0,0,0,0.02)] border-r-emerald-500/20 bg-inherit font-bold text-slate-900"
                  : isSelected ? "text-slate-900" : "text-slate-600"
              } ${isCost ? "text-right font-mono" : ""}`}
            >
              {/* Animated Data Bar Background */}
              {barWidth > 0 && (
                <div
                  className="absolute inset-y-0 right-0 bg-emerald-500/10 pointer-events-none transition-all duration-1000 ease-out"
                  style={{ width: `${barWidth}%` }}
                />
              )}

              {/* Cell Value */}
              <span className="relative z-10 text-[11px] font-medium leading-none tracking-tight">
                {val !== null && val !== undefined ? (
                  isCost && !isNaN(numVal) ? (
                    <span className={numVal > 0 ? "text-slate-900" : "text-emerald-600"}>
                      {numVal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </span>
                  ) : (
                    String(val)
                  )
                ) : (
                  <span className="text-slate-300 italic font-normal">empty</span>
                )}
              </span>
            </td>
          );
        })}
      </tr>
    );
  },
  (prevProps: TableRowProps, nextProps: TableRowProps) => {
    return (
      prevProps.globalIndex === nextProps.globalIndex &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.showDataBars === nextProps.showDataBars &&
      prevProps.visibleColumns.length === nextProps.visibleColumns.length &&
      // Strict equality for data objects
      prevProps.row === nextProps.row &&
      prevProps.columnMaxValues === nextProps.columnMaxValues
    );
  }
);

TableRow.displayName = "TableRow";

export default TableRow;


