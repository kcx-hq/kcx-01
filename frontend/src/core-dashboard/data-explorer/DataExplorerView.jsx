// frontend/core/dashboards/overview/data-explorer/DataExplorerView.jsx
import React, { memo, useCallback } from "react";
import {
  Download,
  Search,
  Table as TableIcon,
  Filter,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  BarChart3,
  CheckSquare,
  PieChart,
  TrendingUp,
  DollarSign,
  Activity,
  Loader2,
  RotateCcw,
  Crown,
  Lock,
} from "lucide-react";

import DataExplorerStates from "./components/DataExplorerStates.jsx";
import PremiumGate from "../common/PremiumGate.jsx";
import DetailPanel from "./components/DetailPanel.jsx";
import TableRow from "./components/TableRow.jsx";
import { downloadCsvFromBackend } from "./utils/downloadCsvFromBackend.js";

const DataExplorerView = ({
  // meta
  api,
  caps,
  loading,
  isInitialLoad,
  isFiltering,
  data,
  totalCount,
  allColumns,
  quickStats,
  summaryData,
  columnMaxValues,
  totalPages,

  // lock
  isLocked,

  // UI state
  searchTerm,
  setSearchTerm,
  selectedRow,
  setSelectedRow,
  sortConfig,
  setSortConfig,
  filterInputs,
  setFilterInputs,
  columnFilters,
  showFilterRow,
  setShowFilterRow,
  hiddenColumns,
  showColumnMenu,
  setShowColumnMenu,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  showDataBars,
  setShowDataBars,
  selectedIndices,
  setSelectedIndices,
  viewMode,
  setViewMode,
  groupByCol,
  setGroupByCol,

  // derived
  visibleColumns,
  tableDataToRender,
  clientSideGroupedData,

  // helpers + actions
  getRowHeight,
  getColumnWidth,
  toggleColumn,
  handleRowSelect,
  handleRowClick,
  removeFilter,
  resetFilters,
  handleDrillDown,

  filters,
}) => {
  // initial loader
  if (loading && isInitialLoad && (!data || data.length === 0)) {
    return <DataExplorerStates type="loading" />;
  }

  // empty
  if (!loading && (!data || data.length === 0)) {
    return <DataExplorerStates type="empty" />;
  }

  const downloadCSV = useCallback(async () => {
    await downloadCsvFromBackend({
      api,
      caps,
      filters,
      currentPage,
      rowsPerPage,
      sortConfig,
      selectedIndices,
    });
  }, [api, caps, filters, currentPage, rowsPerPage, sortConfig, selectedIndices]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full bg-[#0f0f11] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative">
      {/* Full-page overlay only for major loads */}
      {loading && !isFiltering && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0f0f11]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="text-[#a02ff1] animate-spin" size={32} />
            <p className="text-gray-400 text-sm">Loading data...</p>
          </div>
        </div>
      )}

      {/* TOP TOOLBAR */}
      <div className="flex flex-col border-b border-white/10 bg-[#1a1b20]">
        <div className="flex justify-between items-center p-3">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#a02ff1]/10 rounded-lg">
              <TableIcon className="text-[#a02ff1]" size={18} />
            </div>

            {/* Column search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={14}
              />
              <input
                type="text"
                placeholder="Search columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#a02ff1] w-48 transition-all"
              />
              {searchTerm && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
                  {visibleColumns.length}{" "}
                  {visibleColumns.length === 1 ? "column" : "columns"}
                </span>
              )}
            </div>

            <div className="h-6 w-px bg-white/10 mx-1" />

            {/* View Mode */}
            <div className="flex bg-black/40 rounded-lg border border-white/10 p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1 flex items-center gap-2 rounded-md text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-[#a02ff1] text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <TableIcon size={14} /> List
              </button>
              <button
                onClick={() => setViewMode("pivot")}
                className={`px-3 py-1 flex items-center gap-2 rounded-md text-xs font-bold transition-all ${
                  viewMode === "pivot"
                    ? "bg-[#a02ff1] text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <PieChart size={14} /> Group
              </button>
            </div>

            {/* Group By Select (pivot) */}
            {viewMode === "pivot" && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                <span className="text-xs text-gray-500">by</span>

                {/* If locked, keep disabled like your original */}
                {isLocked ? (
                  <select
                    value={groupByCol || ""}
                    onChange={(e) => setGroupByCol(e.target.value)}
                    className="bg-[#0f0f11] border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:border-[#a02ff1] outline-none opacity-50 pointer-events-none"
                    style={{ colorScheme: "dark" }}
                    disabled
                  >
                    <option value="" disabled>
                      Select Column...
                    </option>
                    {allColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={groupByCol || ""}
                    onChange={(e) => setGroupByCol(e.target.value)}
                    className="bg-[#0f0f11] border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:border-[#a02ff1] outline-none"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="" disabled>
                      Select Column...
                    </option>
                    {allColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "table" && (
              <>
                {/* Column menu */}
                <div className="relative group">
                  <button
                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                    className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                      showColumnMenu
                        ? "bg-[#a02ff1] text-white border-[#a02ff1]"
                        : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <EyeOff size={14} /> Cols
                  </button>

                  {showColumnMenu && (
                    <div className="absolute top-full right-0 mt-2 w-56 max-h-80 overflow-y-auto bg-[#25262b] border border-white/10 rounded-xl shadow-2xl z-50 p-2 grid grid-cols-1 gap-1">
                      {allColumns
                        .filter((col) => {
                          if (searchTerm?.trim()) {
                            return col
                              .toLowerCase()
                              .includes(searchTerm.trim().toLowerCase());
                          }
                          return true;
                        })
                        .map((col) => (
                          <button
                            key={col}
                            onClick={() => toggleColumn(col)}
                            className="flex items-center justify-between px-3 py-2 text-xs text-left text-gray-300 hover:bg-white/5 rounded-lg"
                          >
                            <span className="truncate w-40">{col}</span>
                            {!hiddenColumns.includes(col) && (
                              <Check size={12} className="text-[#a02ff1]" />
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowDataBars(!showDataBars)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    showDataBars
                      ? "bg-[#a02ff1]/10 border-[#a02ff1] text-[#a02ff1]"
                      : "border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  <BarChart3 size={14} />
                </button>

                <button
                  onClick={() => setShowFilterRow(!showFilterRow)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    showFilterRow
                      ? "bg-[#a02ff1] text-white border-[#a02ff1]"
                      : "border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  <Filter size={14} />
                </button>

                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-[#a02ff1]/10 hover:bg-[#a02ff1]/20 border border-[#a02ff1]/30 rounded-lg text-xs font-bold text-[#a02ff1] transition-all whitespace-nowrap"
                >
                  <Download size={14} />
                  {selectedIndices.size > 0 ? "Export Selected CSV" : "Export CSV"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats + filter tags */}
        {quickStats && (
          <div className="flex items-center justify-between px-4 py-2 bg-[#15161a] border-t border-white/5 text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-green-500/10 text-green-500">
                  <DollarSign size={12} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">
                    Total Cost
                  </span>
                  <span className="text-white font-mono font-bold">
                    $
                    {quickStats.totalCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-white/5" />

              {isLocked ? (
                <div className="flex items-center gap-2 relative">
                  <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-lg">
                    <Crown size={14} className="text-yellow-400" />
                  </div>
                  <div className="p-1 rounded bg-blue-500/10 text-blue-500 opacity-50 pointer-events-none">
                    <TrendingUp size={12} />
                  </div>
                  <div className="flex flex-col opacity-50 pointer-events-none">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Avg. Cost
                    </span>
                    <span className="text-white font-mono font-bold">
                      ${quickStats.avgCost.toFixed(4)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-500/10 text-blue-500">
                    <TrendingUp size={12} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Avg. Cost
                    </span>
                    <span className="text-white font-mono font-bold">
                      ${quickStats.avgCost.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              <div className="h-6 w-px bg-white/5" />

              {isLocked ? (
                <div className="flex items-center gap-2 relative">
                  <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-lg">
                    <Crown size={14} className="text-yellow-400" />
                  </div>
                  <div className="p-1 rounded bg-purple-500/10 text-purple-500 opacity-50 pointer-events-none">
                    <Activity size={12} />
                  </div>
                  <div className="flex flex-col opacity-50 pointer-events-none">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Records
                    </span>
                    <span className="text-white font-mono font-bold">
                      {totalCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-purple-500/10 text-purple-500">
                    <Activity size={12} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Records
                    </span>
                    <span className="text-white font-mono font-bold">
                      {totalCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="h-6 w-px bg-white/5" />

              {isLocked ? (
                <div className="flex items-center gap-2 relative">
                  <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-lg">
                    <Crown size={14} className="text-yellow-400" />
                  </div>
                  <div className="p-1 rounded bg-orange-500/10 text-orange-500 opacity-50 pointer-events-none">
                    <TableIcon size={12} />
                  </div>
                  <div className="flex flex-col opacity-50 pointer-events-none">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Columns
                    </span>
                    <span className="text-white font-mono font-bold">
                      {allColumns.length}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-orange-500/10 text-orange-500">
                    <TableIcon size={12} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Columns
                    </span>
                    <span className="text-white font-mono font-bold">
                      {allColumns.length}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-all"
                title={
                  viewMode === "pivot"
                    ? "Reset group selection"
                    : "Reset all filters and settings"
                }
              >
                <RotateCcw size={12} />
                <span className="font-medium">Reset</span>
              </button>

              {Object.keys(columnFilters || {}).length > 0 && (
                <>
                  <div className="h-4 w-px bg-white/10" />
                  <span className="text-[10px] text-gray-500 uppercase font-bold mr-1">
                    Active Filters:
                  </span>
                  {Object.entries(columnFilters).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => removeFilter(key)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-[#a02ff1]/20 border border-[#a02ff1]/30 text-[#a02ff1] rounded text-[10px] hover:bg-[#a02ff1]/30 transition-colors"
                    >
                      <span className="font-bold">{key}:</span> {val}{" "}
                      <X size={10} />
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 w-full overflow-auto bg-[#1a1b20] relative scrollbar-thin scrollbar-thumb-gray-700">
        {/* subtle filtering indicator */}
        {isFiltering && !loading && (
          <div className="absolute top-2 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-[#a02ff1]/20 border border-[#a02ff1]/30 rounded-lg backdrop-blur-sm">
            <Loader2 className="text-[#a02ff1] animate-spin" size={14} />
            <span className="text-[#a02ff1] text-xs font-medium">Filtering...</span>
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === "table" && (
          <table className="min-w-full border-collapse text-xs text-left">
            <thead className="bg-[#25262b] text-gray-400 font-bold sticky top-0 z-20 shadow-lg">
              <tr>
                <th className="px-4 py-3 sticky left-0 z-40 bg-[#25262b] border-b border-r border-white/10 w-[50px] text-center">
                  <button
                    onClick={() =>
                      selectedIndices.size === tableDataToRender.length
                        ? setSelectedIndices(new Set())
                        : setSelectedIndices(
                            new Set(
                              tableDataToRender.map(
                                (_, i) => (currentPage - 1) * rowsPerPage + i
                              )
                            )
                          )
                    }
                    className="text-gray-400 hover:text-white"
                  >
                    <CheckSquare size={14} />
                  </button>
                </th>

                {visibleColumns.length > 0 ? (
                  visibleColumns.map((col, idx) => {
                    const isMatched =
                      searchTerm && col.toLowerCase().includes(searchTerm.toLowerCase());
                    return (
                      <th
                        key={col}
                        className={`px-4 py-3 border-b border-r border-white/10 whitespace-nowrap bg-[#25262b] hover:bg-white/5 cursor-pointer group select-none ${
                          idx === 0
                            ? "sticky left-[50px] z-30 shadow-[4px_0_10px_rgba(0,0,0,0.5)] border-r-[#a02ff1]/50"
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
                          <span className={isMatched ? "text-[#a02ff1] font-bold" : ""}>
                            {col}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100">
                            {sortConfig.key === col ? (
                              sortConfig.direction === "asc" ? (
                                <ChevronUp size={12} className="text-[#a02ff1]" />
                              ) : (
                                <ChevronDown size={12} className="text-[#a02ff1]" />
                              )
                            ) : (
                              <div className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })
                ) : (
                  <th
                    colSpan={100}
                    className="px-4 py-8 text-center text-gray-500 bg-[#25262b]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={24} className="text-gray-600" />
                      <span>No columns match "{searchTerm}"</span>
                    </div>
                  </th>
                )}
              </tr>

              {showFilterRow && (
                <tr className="bg-[#1e1f24]">
                  <th className="sticky left-0 z-40 bg-[#1e1f24] border-b border-r border-white/10"></th>
                  {visibleColumns.map((col, idx) => (
                    <th
                      key={`filter-${col}`}
                      className={`p-1 border-b border-r border-white/10 bg-[#1e1f24] ${
                        idx === 0 ? "sticky left-[50px] z-30" : ""
                      }`}
                    >
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={filterInputs[col] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFilterInputs((prev) => {
                            if (value.trim()) return { ...prev, [col]: value };
                            const next = { ...prev };
                            delete next[col];
                            return next;
                          });
                        }}
                        className="w-full px-2 py-1 bg-black/30 border border-white/5 rounded text-[10px] text-white focus:outline-none focus:border-[#a02ff1]"
                      />
                    </th>
                  ))}
                </tr>
              )}
            </thead>

            <tbody>
              {tableDataToRender.map((row, rIdx) => {
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

            {/* Summary footer */}
            <tfoot className="sticky bottom-0 z-30 bg-[#25262b] shadow-[0_-4px_10px_rgba(0,0,0,0.5)] border-t-2 border-[#a02ff1]/30">
              <tr>
                <td className="sticky left-0 z-40 bg-[#25262b] border-r border-white/10"></td>
                {visibleColumns.map((col, idx) => {
                  const total = summaryData?.[col];
                  const isNumeric = total !== null && total !== undefined;
                  return (
                    <td
                      key={col}
                      className={`px-4 py-3 font-bold text-xs whitespace-nowrap border-r border-white/10 bg-[#25262b] ${
                        idx === 0
                          ? "sticky left-[50px] z-40 border-r-[#a02ff1]/50 text-[#a02ff1]"
                          : "text-white"
                      } ${isNumeric ? "text-right text-[#a02ff1] font-mono" : ""}`}
                    >
                      {idx === 0
                        ? "TOTALS"
                        : isNumeric
                        ? total.toLocaleString("en-US", {
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
        )}

        {/* PIVOT VIEW */}
        {viewMode === "pivot" && (
          <div className="w-full relative">
            {isLocked ? (
              <PremiumGate mode="full">
                <div />
              </PremiumGate>
            ) : groupByCol ? (
              <table className="min-w-full border-collapse text-xs text-left">
                <thead className="bg-[#25262b] text-gray-400 font-bold sticky top-0 z-20 shadow-lg">
                  <tr>
                    <th className="px-4 py-3 border-b border-white/10 text-[#a02ff1]">
                      {groupByCol} (Group)
                    </th>
                    <th className="px-4 py-3 border-b border-white/10 text-right">
                      Count
                    </th>
                    <th className="px-4 py-3 border-b border-white/10 text-right">
                      Total Cost
                    </th>
                    <th className="px-4 py-3 border-b border-white/10 w-48">
                      Distribution
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientSideGroupedData.map((group, idx) => (
                    <tr
                      key={idx}
                      onClick={() => handleDrillDown(group)}
                      className="border-b border-white/5 hover:bg-[#a02ff1]/10 cursor-pointer transition-colors bg-[#1a1b20]"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {group.name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {group.count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#a02ff1]">
                        $
                        {group.totalCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#a02ff1]"
                              style={{ width: `${group.percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 w-8 text-right">
                            {group.percent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Layers size={48} className="mb-4 opacity-50" />
                <p>Select a column from the toolbar to group your data.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <DetailPanel
        selectedRow={selectedRow}
        setSelectedRow={setSelectedRow}
        allColumns={allColumns}
      />

      {/* FOOTER */}
      {viewMode === "table" && (
        <div className="bg-[#0f0f11] px-4 py-2 border-t border-white/10 flex justify-between items-center text-xs text-gray-400 shrink-0">
          <div className="flex items-center gap-4">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="bg-[#0f0f11] border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#a02ff1]"
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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExplorerView;
