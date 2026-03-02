// frontend/clients/client-d/dashboards/overview/data-explorer/components/TableView.jsx
import React from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
} from "lucide-react";
import TableRow from "../../../../core-dashboard/data-explorer/components/TableRow";
import type { ExplorerInputChange, ExplorerSelectChange, TableViewProps } from "../types";

const TableView = ({
  // data
  visibleColumns,
  tableDataToRender,
  columnMaxValues,
  summaryData,

  // UI state
  searchTerm,
  sortConfig,
  setSortConfig,
  showFilterRow,
  filterInputs,
  setFilterInputs,
  showDataBars,
  selectedIndices,
  setSelectedIndices,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  totalPages,

  // helpers/actions
  getColumnWidth,
  getRowHeight,
  handleRowSelect,
  handleRowClick,
}: TableViewProps) => {
  return (
    <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-700">
      <table className="min-w-full border-collapse text-xs text-left">
        <thead className="bg-[#1b1c22] text-gray-400 font-bold sticky top-0 z-20 shadow-lg">
          <tr>
            <th className="px-4 py-3 sticky left-0 z-40 bg-[#1b1c22] border-b border-r border-white/10 w-[50px] text-center">
              <button
                onClick={() =>
                  selectedIndices.size === tableDataToRender.length
                    ? setSelectedIndices(new Set())
                    : setSelectedIndices(
                        new Set(
                          tableDataToRender.map(
                            (_: unknown, i: number) => (currentPage - 1) * rowsPerPage + i
                          )
                        )
                      )
                }
                className="text-gray-400 hover:text-white"
                title="Select all on page"
              >
                <Check size={14} />
              </button>
            </th>

            {visibleColumns.length > 0 ? (
              visibleColumns.map((col: string, idx: number) => (
                <th
                  key={col}
                  className={`px-4 py-3 border-b border-r border-white/10 whitespace-nowrap bg-[#1b1c22] hover:bg-white/5 cursor-pointer group select-none ${
                    idx === 0
                      ? "sticky left-[50px] z-30 shadow-[4px_0_10px_rgba(0,0,0,0.5)] border-r-[#23a282]/50"
                      : ""
                  }`}
                  style={{
                    width: getColumnWidth(idx + 1),
                    minWidth: getColumnWidth(idx + 1),
                  }}
                  onClick={() =>
                    setSortConfig({
                      key: col,
                      direction:
                        sortConfig.key === col && sortConfig.direction === "asc"
                          ? "desc"
                          : "asc",
                    })
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{col}</span>
                    <div className="opacity-0 group-hover:opacity-100">
                      {sortConfig.key === col ? (
                        sortConfig.direction === "asc" ? (
                          <ChevronUp size={12} className="text-[#23a282]" />
                        ) : (
                          <ChevronDown size={12} className="text-[#23a282]" />
                        )
                      ) : (
                        <div className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </th>
              ))
            ) : (
              <th colSpan={100} className="px-4 py-10 text-center text-gray-500 bg-[#1b1c22]">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle size={22} className="text-gray-600" />
                  <span>No columns match “{searchTerm}”</span>
                </div>
              </th>
            )}
          </tr>

          {showFilterRow && (
            <tr className="bg-[#14151b]">
              <th className="sticky left-0 z-40 bg-[#14151b] border-b border-r border-white/10"></th>
              {visibleColumns.map((col: string, idx: number) => (
                <th
                  key={`filter-${col}`}
                  className={`p-1 border-b border-r border-white/10 bg-[#14151b] ${
                    idx === 0 ? "sticky left-[50px] z-30" : ""
                  }`}
                >
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filterInputs[col] || ""}
                    onChange={(e: ExplorerInputChange) => {
                      const value = e.target.value;
                      setFilterInputs((prev) => {
                        if (value.trim()) return { ...prev, [col]: value };
                        const next = { ...prev };
                        delete next[col];
                        return next;
                      });
                    }}
                    className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-[10px] text-white focus:outline-none focus:border-[#23a282]"
                  />
                </th>
              ))}
            </tr>
          )}
        </thead>

        <tbody>
          {tableDataToRender.map((row, rIdx: number) => {
            const globalIndex = (currentPage - 1) * rowsPerPage + rIdx;
            const isSelected = selectedIndices.has(globalIndex);
            return (
              <TableRow
                key={globalIndex}
                row={row}
                rIdx={rIdx}
                globalIndex={globalIndex}
                isSelected={isSelected}
                visibleColumns={visibleColumns}
                columnMaxValues={columnMaxValues}
                showDataBars={showDataBars}
                getRowHeight={getRowHeight}
                onSelect={() => handleRowSelect(globalIndex)}
                onRowClick={() => handleRowClick(row)}
              />
            );
          })}
        </tbody>

        <tfoot className="sticky bottom-0 z-30 bg-[#1b1c22] border-t-2 border-[#23a282]/30 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
          <tr>
            <td className="sticky left-0 z-40 bg-[#1b1c22] border-r border-white/10"></td>
            {visibleColumns.map((col: string, idx: number) => {
              const total = summaryData?.[col];
              const showTotal =
                total !== null && total !== undefined && total !== "" && typeof total !== "object";

              return (
                <td
                  key={col}
                  className={`px-4 py-3 font-bold text-xs whitespace-nowrap border-r border-white/10 bg-[#1b1c22] ${
                    idx === 0
                      ? "sticky left-[50px] z-40 border-r-[#23a282]/50 text-[#23a282]"
                      : "text-white"
                  } ${showTotal ? "text-right text-[#23a282] font-mono" : ""}`}
                >
                  {idx === 0
                    ? "TOTALS"
                    : showTotal
                    ? Number(total).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : ""}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>

      {/* Pagination footer */}
      <div className="px-5 py-3 border-t border-white/10 bg-[#121319] flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span>
            Page <span className="text-gray-200 font-bold">{currentPage}</span> of{" "}
            <span className="text-gray-200 font-bold">{totalPages}</span>
          </span>
          <select
            value={rowsPerPage}
            onChange={(e: ExplorerSelectChange) => setRowsPerPage(Number(e.target.value))}
            className="bg-[#0f0f11] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#23a282]"
            style={{ colorScheme: "dark" }}
          >
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={500}>500 rows</option>
            <option value={1000}>1000 rows</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl hover:bg-white/5 disabled:opacity-30"
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl hover:bg-white/5 disabled:opacity-30"
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableView;
