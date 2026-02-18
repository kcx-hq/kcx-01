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
  Sparkles
} from "lucide-react";

import DataExplorerStates from "./components/DataExplorerStates.jsx";
import PremiumGate from "../common/PremiumGate.jsx";
import DetailPanel from "./components/DetailPanel.jsx";
import TableRow from "./components/TableRow.jsx";
import { downloadCsvFromBackend } from "./utils/downloadCsvFromBackend.js";
import { SectionLoading } from "../common/SectionStates.jsx";

const BRAND_EMERALD = "#007758";

const DataExplorerView = ({
  api, caps, loading, isInitialLoad, isFiltering, isPaginating, data, totalCount, allColumns, quickStats,
  summaryData, columnMaxValues, totalPages, isLocked, searchTerm, setSearchTerm,
  selectedRow, setSelectedRow, sortConfig, setSortConfig, filterInputs, setFilterInputs,
  columnFilters, showFilterRow, setShowFilterRow, hiddenColumns, showColumnMenu,
  setShowColumnMenu, currentPage, setCurrentPage, rowsPerPage, setRowsPerPage,
  showDataBars, setShowDataBars, selectedIndices, setSelectedIndices, viewMode,
  setViewMode, groupByCol, setGroupByCol, visibleColumns, tableDataToRender,
  clientSideGroupedData, getRowHeight, getColumnWidth, toggleColumn, handleRowSelect,
  handleRowClick, removeFilter, resetFilters, handleDrillDown, filters,
}) => {

  if (loading && (!data || data.length === 0)) {
    return <SectionLoading label="Analyzing Data Explorer..." />;
  }

  if (!loading && (!data || data.length === 0)) {
    return <DataExplorerStates type="empty" />;
  }

  const downloadCSV = useCallback(async () => {
    await downloadCsvFromBackend({
      api, caps, filters, currentPage, rowsPerPage, sortConfig, selectedIndices,
    });
  }, [api, caps, filters, currentPage, rowsPerPage, sortConfig, selectedIndices]);

  return (
    <div className="relative flex h-[calc(100vh-120px)] min-h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in zoom-in-95 duration-500 md:h-[calc(100vh-140px)] md:rounded-[2rem]">
      
      {/* TOP TOOLBAR */}
      <div className="flex flex-col border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col gap-3 p-3 md:p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full items-center gap-3 overflow-x-auto no-scrollbar md:gap-5 xl:w-auto">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
              <TableIcon className="text-[#007758]" size={18} />
            </div>

            {/* Column search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#007758] transition-colors" size={14} />
              <input
                type="text"
                placeholder="Search columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-44 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 shadow-sm transition-all focus:border-[#007758]/30 focus:outline-none focus:ring-4 focus:ring-emerald-50 sm:w-56"
              />
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            {/* View Mode Switcher */}
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-1.5 flex items-center gap-2 rounded-lg text-xs font-black transition-all ${
                  viewMode === "table" ? "bg-white text-[#007758] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Layers size={14} /> List View
              </button>
              <button
                onClick={() => setViewMode("pivot")}
                className={`px-4 py-1.5 flex items-center gap-2 rounded-lg text-xs font-black transition-all ${
                  viewMode === "pivot" ? "bg-white text-[#007758] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <PieChart size={14} /> Pivot Group
              </button>
            </div>

            {/* Group By Selector */}
            {viewMode === "pivot" && (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">By</span>
                <select
                  value={groupByCol || ""}
                  onChange={(e) => setGroupByCol(e.target.value)}
                  disabled={isLocked}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-emerald-50 outline-none shadow-sm disabled:opacity-50 transition-all cursor-pointer hover:border-slate-300"
                >
                  <option value="" disabled>Select Dimension...</option>
                  {allColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex w-full items-center gap-2 overflow-x-auto no-scrollbar xl:w-auto xl:justify-end xl:gap-3">
            {viewMode === "table" && (
              <>
                {/* Column Visibility Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 border rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      showColumnMenu ? "bg-[#007758] text-white border-[#007758] shadow-lg shadow-emerald-100" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <EyeOff size={14} /> Visibility
                  </button>

                  {showColumnMenu && (
                    <div className="absolute top-full right-0 mt-3 w-64 max-h-80 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 p-2 ring-1 ring-slate-200/50">
                      <div className="p-2 border-b border-slate-50 mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Active Dimensions</span>
                      </div>
                      {allColumns.filter(col => !searchTerm || col.toLowerCase().includes(searchTerm.toLowerCase())).map((col) => (
                        <button
                          key={col}
                          onClick={() => toggleColumn(col)}
                          className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-[#007758] rounded-xl transition-colors"
                        >
                          <span className="truncate pr-4">{col}</span>
                          {!hiddenColumns.includes(col) && <Check size={14} className="text-[#007758]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowDataBars(!showDataBars)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    showDataBars ? "bg-emerald-50 border-emerald-200 text-[#007758]" : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <BarChart3 size={16} />
                </button>

                <button
                  onClick={() => setShowFilterRow(!showFilterRow)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    showFilterRow ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Filter size={16} />
                </button>

                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 px-3 md:px-5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black text-[#007758] transition-all whitespace-nowrap"
                >
                  <Download size={14} /> {selectedIndices.size > 0 ? "Export Selection" : "Export CSV"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* QUICK STATS BAR */}
        {quickStats && (
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-3 py-2.5 text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] md:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4 md:gap-10">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-[#007758] border border-emerald-100">
                  <DollarSign size={12} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Gross Expenditure</span>
                  <span className="text-slate-900 font-black text-sm">${quickStats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-100" />

              <div className="flex items-center gap-3 relative">
                {isLocked && (
                    <div className="absolute -inset-1 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg border border-slate-100 border-dashed cursor-not-allowed">
                        <Lock size={12} className="text-amber-500" />
                    </div>
                )}
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <TrendingUp size={12} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Average Unit Cost</span>
                  <span className="text-slate-900 font-black text-sm">${quickStats.avgCost.toFixed(4)}</span>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-100" />

              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Activity size={12} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">System Records</span>
                  <span className="text-slate-900 font-black text-sm">{totalCount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Reset Filters & Active Tags */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 transition-all uppercase tracking-widest"
              >
                <RotateCcw size={10} /> Reset
              </button>

              {Object.keys(columnFilters || {}).length > 0 && (
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  {Object.entries(columnFilters).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => removeFilter(key)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-[#007758] rounded-md text-[10px] font-bold hover:bg-emerald-100 transition-colors shadow-sm"
                    >
                      <span className="opacity-60">{key}:</span> {val} <X size={10} strokeWidth={3} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 w-full overflow-auto bg-white relative scrollbar-thin scrollbar-thumb-slate-200">
        {isFiltering && !loading && (
          <div className="absolute right-2 top-2 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-1.5 text-white shadow-xl animate-in slide-in-from-top-4 md:right-6 md:top-4 md:gap-3 md:px-4 md:py-2">
            <Loader2 className="animate-spin" size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Applying Filters</span>
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === "table" && (
          <table className="min-w-full border-separate border-spacing-0 text-xs text-left">
            <thead className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <tr>
                <th className="px-4 py-4 sticky left-0 z-40 bg-slate-50 border-b border-r border-slate-100 w-[60px] text-center">
                  <button
                    onClick={() => selectedIndices.size === tableDataToRender.length ? setSelectedIndices(new Set()) : setSelectedIndices(new Set(tableDataToRender.map((_, i) => (currentPage - 1) * rowsPerPage + i)))}
                    className="text-slate-400 hover:text-[#007758] transition-colors"
                  >
                    <CheckSquare size={16} />
                  </button>
                </th>
                {visibleColumns.map((col, idx) => {
                  const isMatched = searchTerm && col.toLowerCase().includes(searchTerm.toLowerCase());
                  return (
                    <th
                      key={col}
                      className={`px-5 py-4 border-b border-r border-slate-100 whitespace-nowrap bg-slate-50 hover:bg-slate-100 cursor-pointer group select-none transition-colors ${
                        idx === 0 ? "sticky left-[60px] z-30 shadow-[4px_0_10px_rgba(0,0,0,0.02)] border-r-emerald-500/20" : ""
                      }`}
                      style={{ width: getColumnWidth(idx + 1), minWidth: getColumnWidth(idx + 1) }}
                      onClick={() => setSortConfig({ key: col, direction: sortConfig.key === col && sortConfig.direction === "asc" ? "desc" : "asc" })}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-black uppercase tracking-wider text-[10px] ${isMatched ? "text-[#007758]" : "text-slate-500"}`}>{col}</span>
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp size={10} className={sortConfig.key === col && sortConfig.direction === "asc" ? "text-[#007758]" : "text-slate-300"} />
                          <ChevronDown size={10} className={sortConfig.key === col && sortConfig.direction === "desc" ? "text-[#007758]" : "text-slate-300"} />
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>

              {showFilterRow && (
                <tr className="bg-white">
                  <th className="sticky left-0 z-40 bg-white border-b border-r border-slate-100"></th>
                  {visibleColumns.map((col, idx) => (
                    <th key={`filter-${col}`} className={`p-2 border-b border-r border-slate-100 bg-white ${idx === 0 ? "sticky left-[60px] z-30" : ""}`}>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={filterInputs[col] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFilterInputs(prev => {
                            if (val === "") { const next = { ...prev }; delete next[col]; return next; }
                            return { ...prev, [col]: val };
                          });
                        }}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-900 font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-[#007758]/30 transition-all placeholder:text-slate-300"
                      />
                    </th>
                  ))}
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-50">
              {tableDataToRender.map((row, rIdx) => {
                const globalIndex = (currentPage - 1) * rowsPerPage + rIdx;
                return (
                  <TableRow
                    key={globalIndex} row={row} rIdx={rIdx} globalIndex={globalIndex} isSelected={selectedIndices.has(globalIndex)}
                    visibleColumns={visibleColumns} columnMaxValues={columnMaxValues} showDataBars={showDataBars}
                    getRowHeight={getRowHeight} onSelect={() => handleRowSelect(globalIndex)} onRowClick={() => handleRowClick(row)}
                  />
                );
              })}
            </tbody>

            {/* SUMMARY FOOTER */}
            <tfoot className="sticky bottom-0 z-30 bg-slate-50 border-t-2 border-[#007758]/10 shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
              <tr>
                <td className="sticky left-0 z-40 bg-slate-50 border-r border-slate-100"></td>
                {visibleColumns.map((col, idx) => {
                  const total = summaryData?.[col];
                  const isNumeric = typeof total === 'number';
                  return (
                    <td
                      key={col}
                      className={`px-5 py-4 font-black text-[11px] whitespace-nowrap border-r border-slate-100 bg-slate-50/80 backdrop-blur-sm ${
                        idx === 0 ? "sticky left-[60px] z-40 border-r-emerald-500/20 text-[#007758]" : "text-slate-700"
                      } ${isNumeric ? "text-right font-mono" : ""}`}
                    >
                      {idx === 0 ? "AGGREGATE TOTALS" : isNumeric ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ""}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        )}

        {/* PIVOT VIEW */}
        {viewMode === "pivot" && (
          <div className="w-full relative p-6">
            {isLocked ? (
              <div className="max-w-xl mx-auto py-20">
                <PremiumGate mode="full">
                  <div className="text-center p-10 bg-slate-50 rounded-[2.5rem] border border-slate-200 border-dashed">
                      <Crown size={48} className="mx-auto text-amber-500 mb-4" />
                      <h4 className="text-lg font-black text-slate-800 mb-2">Pivot Intelligence is Locked</h4>
                      <p className="text-sm text-slate-500 font-medium">Upgrade to KCX Premium to unlock multi-dimensional data grouping and drill-down analysis.</p>
                  </div>
                </PremiumGate>
              </div>
            ) : groupByCol ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
                <table className="min-w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-black uppercase text-[10px] text-[#007758] tracking-[0.15em]">{groupByCol} Dimensional Group</th>
                        <th className="px-6 py-4 font-black uppercase text-[10px] text-slate-500 tracking-[0.15em] text-right">Occurrence</th>
                        <th className="px-6 py-4 font-black uppercase text-[10px] text-slate-500 tracking-[0.15em] text-right">Total Impact</th>
                        <th className="px-6 py-4 font-black uppercase text-[10px] text-slate-500 tracking-[0.15em] w-64">Relative Distribution</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {clientSideGroupedData.map((group, idx) => (
                        <tr key={idx} onClick={() => handleDrillDown(group)} className="hover:bg-emerald-50/30 cursor-pointer transition-colors group">
                        <td className="px-6 py-4 font-black text-slate-900 group-hover:text-[#007758]">{group.name}</td>
                        <td className="px-6 py-4 text-right text-slate-500 font-bold">{group.count.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-mono text-[#007758] font-black">${group.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-[#007758] to-[#10b981] rounded-full" style={{ width: `${group.percent}%` }} />
                                </div>
                                <span className="text-[10px] font-black text-[#007758] w-10 text-right">{group.percent.toFixed(1)}%</span>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-4">
                <div className="p-8 bg-slate-50 rounded-full border border-dashed border-slate-200">
                    <Sparkles size={48} className="opacity-20" />
                </div>
                <div className="text-center">
                    <p className="font-black text-slate-800 mb-1">Dimension Not Selected</p>
                    <p className="text-xs font-medium text-slate-500">Choose a column from the toolbar to initiate multidimensional grouping.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <DetailPanel selectedRow={selectedRow} setSelectedRow={setSelectedRow} allColumns={allColumns} />

      {/* FOOTER / PAGINATION */}
      {viewMode === "table" && (
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-3 py-3 text-[11px] font-bold text-slate-500 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] md:flex md:items-center md:justify-between md:px-6">
          <div className="flex flex-wrap items-center gap-3 md:gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Page {currentPage} of {totalPages}
            </span>
            {isPaginating && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#007758]">
                <Loader2 size={10} className="animate-spin" />
                Loading page...
              </span>
            )}
            <div className="flex items-center gap-2">
                <span className="uppercase text-[9px] tracking-widest text-slate-400">Show</span>
                <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none focus:border-[#007758] shadow-sm cursor-pointer transition-all"
                >
                <option value={50}>50 Rows</option>
                <option value={100}>100 Rows</option>
                <option value={500}>500 Rows</option>
                </select>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-1 md:mt-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isPaginating}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-20 disabled:grayscale transition-all shadow-sm active:scale-95"
            >
              <ChevronLeft size={16} className="text-slate-600" />
            </button>
            <div className="px-3 flex gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pgNum = i + 1;
                    return (
                        <button 
                            key={pgNum} 
                            onClick={() => setCurrentPage(pgNum)}
                            disabled={isPaginating}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${currentPage === pgNum ? "bg-[#007758] text-white shadow-lg shadow-emerald-100" : "text-slate-500 hover:bg-slate-200/50"}`}
                        >
                            {pgNum}
                        </button>
                    )
                })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isPaginating}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-20 disabled:grayscale transition-all shadow-sm active:scale-95"
            >
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExplorerView;
