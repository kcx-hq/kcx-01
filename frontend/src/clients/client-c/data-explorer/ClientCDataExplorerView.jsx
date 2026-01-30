import React, { useState } from "react";

// Updated function signature - full module including ContextFilters to comply with current config module
function getContextWithFilters(widget, accountId, parent, initialContext) { 
  return { 
    ...initialContext, 
    filters: { accountId, parent }, 
    widget 
  }; 
}const FullScreenLoader = ({ text = "Loading data..." }) => (
  <div className="flex items-center justify-center h-[70vh]">
    <div className="flex flex-col items-center gap-4">
      <svg
        className="w-12 h-12 animate-spin text-[#a02ff1]"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <p className="text-gray-400 text-sm">
        Fetching data from backend…
      </p>
    </div>
  </div>
);

const DataExplorer = ({
  // data + meta
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
  density,
  setDensity,
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
  // passthrough for backend export
  filters,
  uploadId,
}) => {
  const [showAggregates, setShowAggregates] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const visibleData = viewMode === "table" ? tableDataToRender : clientSideGroupedData;

  // Calculate aggregated metrics
  const calculateAggregates = () => {
    if (!data || data.length === 0) return {};
    
    const numericColumns = [];
    const aggregates = {};
    
    // Identify numeric columns
    if (allColumns && data[0]) {
      allColumns.forEach(col => {
        const isNumeric = data.some(row => {
          const val = row[col];
          return typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)));
        });
        if (isNumeric) {
          numericColumns.push(col);
          
          // Calculate sum for this column
          let sum = 0;
          let min = Infinity;
          let max = -Infinity;
          let count = 0;
          
          data.forEach(row => {
            const val = typeof row[col] === 'string' ? parseFloat(row[col]) : row[col];
            if (typeof val === 'number' && !isNaN(val)) {
              sum += val;
              min = Math.min(min, val);
              max = Math.max(max, val);
              count++;
            }
          });
          
          aggregates[col] = {
            sum: sum,
            avg: count > 0 ? sum / count : 0,
            min: isFinite(min) ? min : 0,
            max: isFinite(max) ? max : 0,
            count: count
          };
        }
      });
    }
    
    return { numericColumns, aggregates };
  };
  
  const { numericColumns, aggregates } = calculateAggregates();

  // Handle sorting
  const handleSort = (columnKey) => {
    setSortConfig((prev) => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle column filter input
  const handleColumnFilterChange = (column, value) => {
    setFilterInputs((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  // Export CSV handler
  const handleExportCSV = async () => {
    try {
      if (!api || !caps) {
        alert("API not available");
        return;
      }

      const blob = await api.call("dataExplorer", "exportCsv", {
        params: {
          provider: filters?.provider !== "All" ? filters.provider : undefined,
          service: filters?.service !== "All" ? filters.service : undefined,
          region: filters?.region !== "All" ? filters.region : undefined,
          page: currentPage,
          limit: rowsPerPage,
          sortBy: sortConfig?.key || undefined,
          sortOrder: sortConfig?.direction || "asc",
          selectedIndices: selectedIndices.size > 0 ? JSON.stringify(Array.from(selectedIndices)) : undefined,
          visibleColumns: visibleColumns?.length > 0 ? JSON.stringify(visibleColumns) : undefined,
          uploadId: uploadId
        },
        responseType: "blob",
      });

      if (!blob) return;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ClientC_DataExplorer_Export_${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to export CSV. Please try again.");
    }
  };



  // Render quick stats
  const renderQuickStats = () => {
    if (!quickStats) return null;
    
    // Calculate data size and other metrics
    const dataSize = data ? JSON.stringify(data).length / 1024 : 0; // Size in KB
    const lastUpdated = new Date().toLocaleTimeString();
    const recordSize = allColumns ? totalCount * allColumns.length : 0;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 hover:border-[#a02ff1]/20 transition-all duration-200">
          <div className="text-xs text-gray-400 mb-1">Total Records</div>
          <div className="text-2xl font-bold text-white">{totalCount?.toLocaleString() || '0'}</div>
          <div className="text-xs text-gray-500 mt-1 truncate">{recordSize.toLocaleString()} cells</div>
        </div>
        <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 hover:border-[#a02ff1]/20 transition-all duration-200">
          <div className="text-xs text-gray-400 mb-1">Columns</div>
          <div className="text-2xl font-bold text-white">{allColumns?.length || '0'}</div>
          <div className="text-xs text-gray-500 mt-1 truncate">{numericColumns?.length || '0'} numeric</div>
        </div>
        <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 hover:border-[#a02ff1]/20 transition-all duration-200">
          <div className="text-xs text-gray-400 mb-1">Selected</div>
          <div className="text-2xl font-bold text-[#a02ff1]">{selectedIndices?.size || '0'}</div>
          <div className="text-xs text-gray-500 mt-1 truncate">{totalCount ? Math.round((selectedIndices?.size / totalCount) * 100) || 0 : 0}% of total</div>
        </div>
        <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 hover:border-[#a02ff1]/20 transition-all duration-200">
          <div className="text-xs text-gray-400 mb-1">Data Size</div>
          <div className="text-2xl font-bold text-green-400">{(dataSize > 1024 ? (dataSize/1024).toFixed(2) + ' MB' : dataSize.toFixed(2) + ' KB')}</div>
          <div className="text-xs text-gray-500 mt-1 truncate">Updated: {lastUpdated}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      {/* Show Loading Animation when fetching data */}
      {loading && isInitialLoad && <FullScreenLoader />}

      {/* Only show content when data is loaded */}
      {!loading && (
        <>
          {/* Quick Stats */}
          {renderQuickStats()}

      {/* Aggregates Panel */}
      {showAggregates && (
        <div className="mb-6 p-4 bg-[#1a1b20]/60 backdrop-blur-md rounded-xl border border-white/5 shadow-lg z-[100]">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Aggregated Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {numericColumns && numericColumns.map(col => (
              <div key={col} className="bg-[#25262b] p-3 rounded-lg border border-white/10">
                <div className="text-sm text-gray-400 truncate">{col}</div>
                <div className="text-lg font-bold text-white">{aggregates[col]?.sum?.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Avg: {aggregates[col]?.avg?.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Min: {aggregates[col]?.min?.toLocaleString()}, Max: {aggregates[col]?.max?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Panel */}
      {showStats && (
        <div className="mb-6 p-4 bg-[#1a1b20]/60 backdrop-blur-md rounded-xl border border-white/5 shadow-lg z-[100]">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Data Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#25262b] p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400">Total Records</div>
              <div className="text-2xl font-bold text-white">{totalCount?.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-[#25262b] p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400">Total Columns</div>
              <div className="text-2xl font-bold text-white">{allColumns?.length || '0'}</div>
            </div>
            <div className="bg-[#25262b] p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400">Numeric Columns</div>
              <div className="text-2xl font-bold text-white">{numericColumns?.length || '0'}</div>
            </div>
            <div className="bg-[#25262b] p-3 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400">Selected Rows</div>
              <div className="text-2xl font-bold text-[#a02ff1]">{selectedIndices?.size || '0'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-[#1a1b20]/50 backdrop-blur-md rounded-xl border border-white/5 shadow-lg">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0f0f11] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a02ff1] focus:border-transparent transition-all"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Department Filter - Removed as per requirements */}

        {/* View Mode Toggle */}
        <div className="flex bg-[#0f0f11] rounded-lg border border-white/10 p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              viewMode === "table"
                ? "bg-[#a02ff1] text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("pivot")}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              viewMode === "pivot"
                ? "bg-[#a02ff1] text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Pivot
          </button>
        </div>

        {/* Aggregates Toggle */}
        <button
          onClick={() => setShowAggregates(!showAggregates)}
          className={`px-3 py-2 bg-[#0f0f11] border border-white/10 rounded-lg text-sm transition-all ${
            showAggregates
              ? "text-[#a02ff1] border-[#a02ff1]/50 bg-[#a02ff1]/10"
              : "text-gray-400 hover:text-white hover:border-white/20"
          }`}
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Aggregates {showAggregates ? '(ON)' : '(OFF)'}
        </button>

        {/* Stats Toggle */}
        <button
          onClick={() => setShowStats(!showStats)}
          className={`px-3 py-2 bg-[#0f0f11] border border-white/10 rounded-lg text-sm transition-all ${
            showStats
              ? "text-[#a02ff1] border-[#a02ff1]/50 bg-[#a02ff1]/10"
              : "text-gray-400 hover:text-white hover:border-white/20"
          }`}
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Stats {showStats ? '(ON)' : '(OFF)'}
        </button>

        {/* Data Bars Toggle */}
        <button
          onClick={() => setShowDataBars(!showDataBars)}
          className={`px-3 py-2 bg-[#0f0f11] border border-white/10 rounded-lg text-sm transition-all ${
            showDataBars
              ? "text-[#a02ff1] border-[#a02ff1]/50 bg-[#a02ff1]/10"
              : "text-gray-400 hover:text-white hover:border-white/20"
          }`}
        >
          Data Bars
        </button>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          disabled={loading}
          className="px-4 py-2 bg-[#a02ff1] hover:bg-[#8a2be2] text-white rounded-lg text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#a02ff1]/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>

        {/* Reset Filters */}
        <button
          onClick={resetFilters}
          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2 transition-all border border-red-500/30 hover:border-red-500/50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
      </div>

      {/* Active Filters */}
      {Object.keys(columnFilters).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(columnFilters).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#a02ff1]/20 text-[#a02ff1] rounded-lg text-sm border border-[#a02ff1]/30"
            >
              <span>{key}: {value}</span>
              <button
                onClick={() => removeFilter(key)}
                className="hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filtering Indicator */}
      {isFiltering && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Applying filters...
        </div>
      )}

      {/* Table Container */}
      <div className="bg-[#1a1b20]/50 backdrop-blur-md rounded-xl border border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-auto max-h-[600px]">
          <table className="min-w-full border-collapse text-xs text-left">
            <thead className="bg-[#25262b] text-gray-400 font-bold sticky top-0 z-[10] shadow-lg">
              <tr>
                {/* Selection Header */}
                <th className="px-4 py-3 sticky left-0 z-[50] bg-[#25262b] border-b border-r border-white/10 w-[50px] text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-600 bg-gray-800 text-[#a02ff1] focus:ring-[#a02ff1]"
                  />
                </th>

                {/* Column Headers */}
                {visibleColumns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 sticky top-0 z-[40] bg-[#25262b] border-b border-white/10 cursor-pointer hover:text-white transition-colors group"
                    style={{ width: `${getColumnWidth(visibleColumns.indexOf(column))}px` }}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{column}</span>
                      {sortConfig.key === column && (
                        <span className="ml-1">
                          {sortConfig.direction === "asc" ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>

              {/* Column Filter Row */}
              {showFilterRow && (
                <tr className="border-t border-white/10">
                  <td className="px-4 py-2 sticky left-0 z-[50] bg-[#25262b]"></td>
                  {visibleColumns.map((column) => (
                    <td key={column} className="px-4 py-2 sticky top-0 z-[40] bg-[#25262b]">
                      <input
                        type="text"
                        placeholder={`Filter ${column}...`}
                        value={filterInputs[column] || ""}
                        onChange={(e) => handleColumnFilterChange(column, e.target.value)}
                        className="w-full px-2 py-1 bg-[#0f0f11] border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#a02ff1]"
                      />
                    </td>
                  ))}
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-white/5">
              {visibleData.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => handleRowClick(row)}
                >
                  <td className="px-4 py-2 sticky left-0 z-30 bg-[#1a1b20] border-r border-white/5">
                    <input
                      type="checkbox"
                      checked={selectedIndices.has(index)}
                      onChange={() => handleRowSelect(index)}
                      className="rounded border-gray-600 bg-gray-800 text-[#a02ff1] focus:ring-[#a02ff1]"
                    />
                  </td>
                  {visibleColumns.map((col, colIndex) => {
                    const value = row[col];
                    const maxValue = columnMaxValues[col];
                    const numericValue = typeof value === 'number' ? value : 
                                        (typeof value === 'string' && !isNaN(parseFloat(value)) ? parseFloat(value) : 0);
                    const percentage = maxValue > 0 ? (numericValue / maxValue) * 100 : 0;

                    return (
                      <td 
                        key={colIndex} 
                        className={`px-4 py-2 text-sm text-gray-300 relative ${
                          colIndex === 0 ? "font-medium" : ""
                        } z-20`}
                        style={{ width: `${getColumnWidth(colIndex)}px` }}
                      >
                        {/* Data Bar Visualization */}
                        {showDataBars && typeof numericValue === 'number' && !isNaN(numericValue) && (
                          <div className="absolute left-0 top-0 bottom-0 bg-[#a02ff1]/10 rounded-r"
                               style={{ width: `${percentage}%` }} />
                        )}
                        
                        <div className="relative z-10 truncate">
                          {value === null || value === undefined ? (
                            <span className="text-gray-500 italic">null</span>
                          ) : typeof value === 'object' ? (
                            <span className="text-blue-400">{JSON.stringify(value, null, 2)}</span>
                          ) : (
                            String(value)
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {visibleData.length === 0 && !loading && (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.7-2.709" />
                </svg>
                <p className="text-gray-400">No data matches your filters</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-400">
          Showing {Math.min((currentPage - 1) * rowsPerPage + 1, totalCount)} to {" "}
          {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount} entries
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-[#0f0f11] border border-white/10 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="px-3 py-1.5 text-sm text-gray-300 bg-[#0f0f11] border border-white/10 rounded">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 bg-[#0f0f11] border border-white/10 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default DataExplorer;
