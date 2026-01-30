// frontend/clients/client-d/dashboards/overview/data-explorer/components/HeaderBar.jsx
import React, { useMemo } from "react";
import {
  Download,
  Search,
  Table as TableIcon,
  Filter,
  BarChart3,
  RotateCcw,
  PieChart,
  DollarSign,
  TrendingUp,
  Activity,
  Columns3,
  EyeOff,
  Crown,
  Loader2,
  X,
} from "lucide-react";

import StatCard from "./StatCard.jsx";

const HeaderBar = ({
  // meta
  loading,
  isFiltering,
  quickStats,
  totalCount,
  allColumns,

  // lock
  isLocked,

  // state
  viewMode,
  setViewMode,
  groupByCol,
  setGroupByCol,
  searchTerm,
  setSearchTerm,
  showDataBars,
  setShowDataBars,
  showFilterRow,
  setShowFilterRow,
  setShowColumnMenu,
  resetFilters,

  // filters
  columnFilters,
  removeFilter,

  // action
  onExportCsv,
}) => {
  const activeFilters = useMemo(() => Object.entries(columnFilters || {}), [columnFilters]);

  const totalCostText = useMemo(() => {
    const v = Number(quickStats?.totalCost ?? 0);
    return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [quickStats]);

  const avgCostText = useMemo(() => `$${Number(quickStats?.avgCost ?? 0).toFixed(4)}`, [quickStats]);

  return (
    <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-b from-[#171820] to-[#121319] relative">
      {/* subtle filtering indicator */}
      {isFiltering && !loading && (
        <div className="absolute top-4 right-5 z-40 flex items-center gap-2 px-3 py-1.5 bg-[#a02ff1]/15 border border-[#a02ff1]/25 rounded-xl backdrop-blur-sm">
          <Loader2 className="text-[#a02ff1] animate-spin" size={14} />
          <span className="text-[#a02ff1] text-xs font-semibold">Filtering...</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#a02ff1]/10 border border-[#a02ff1]/20">
              <TableIcon size={18} className="text-[#a02ff1]" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-extrabold text-lg truncate">Data Explorer</div>
              <div className="text-xs text-gray-500 truncate">Inspect raw billing records • Client-D layout</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-black/40 rounded-xl border border-white/10 p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                viewMode === "table" ? "bg-[#a02ff1] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <TableIcon size={14} /> List
            </button>
            <button
              onClick={() => setViewMode("pivot")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                viewMode === "pivot" ? "bg-[#a02ff1] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <PieChart size={14} /> Group
            </button>
          </div>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#a02ff1]/10 hover:bg-[#a02ff1]/20 border border-[#a02ff1]/30 text-[#a02ff1] text-xs font-extrabold transition"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <StatCard icon={DollarSign} label="Total Cost" value={totalCostText} locked={false} />
        <StatCard icon={TrendingUp} label="Avg Cost" value={avgCostText} locked={isLocked} />
        <StatCard icon={Activity} label="Records" value={Number(totalCount || 0).toLocaleString()} locked={isLocked} />
        <StatCard icon={Columns3} label="Columns" value={Number(allColumns?.length || 0)} locked={isLocked} />
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input
              type="text"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#a02ff1] w-56"
            />
          </div>

          <button
            onClick={() => setShowColumnMenu(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition"
          >
            <EyeOff size={14} />
            Columns
          </button>

          <button
            onClick={() => setShowDataBars((s) => !s)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              showDataBars
                ? "bg-[#a02ff1]/10 border-[#a02ff1]/30 text-[#a02ff1]"
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            }`}
          >
            <BarChart3 size={14} />
            Bars
          </button>

          <button
            onClick={() => setShowFilterRow((s) => !s)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
              showFilterRow
                ? "bg-[#a02ff1] text-white border-[#a02ff1]"
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            }`}
          >
            <Filter size={14} />
            Filters
          </button>

          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition flex items-center gap-2"
            title={viewMode === "pivot" ? "Reset group selection" : "Reset all filters/settings"}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {/* Group by */}
        {viewMode === "pivot" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Group by</span>

            {isLocked ? (
              <div className="relative">
                <select
                  value={groupByCol || ""}
                  onChange={(e) => setGroupByCol(e.target.value)}
                  className="bg-[#0f0f11] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 opacity-50 pointer-events-none"
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <Crown size={16} className="text-yellow-400" />
                </div>
              </div>
            ) : (
              <select
                value={groupByCol || ""}
                onChange={(e) => setGroupByCol(e.target.value)}
                className="bg-[#0f0f11] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-[#a02ff1] outline-none"
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

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Active
          </span>
          {activeFilters.map(([key, val]) => (
            <button
              key={key}
              onClick={() => removeFilter(key)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#a02ff1]/15 border border-[#a02ff1]/25 text-[#a02ff1] text-[10px] font-bold hover:bg-[#a02ff1]/25 transition"
              title="Remove filter"
            >
              {key}: {String(val)}
              <X size={12} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeaderBar;
