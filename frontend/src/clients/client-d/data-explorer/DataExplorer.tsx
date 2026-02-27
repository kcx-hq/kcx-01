// frontend/clients/client-d/dashboards/overview/data-explorer/DataExplorer.jsx
import React, { useMemo, useState, useCallback } from "react";
import { useAuthStore } from "../../../store/Authstore";

// ✅ Reuse core view (UI stays same)
import DataExplorerView from "./DataExplorerView";

// hooks (client-d)
import { useDebouncedObject } from "../../../core-dashboard/data-explorer/hooks/useDebouncedObject";
import { useDataExplorerData } from "./hooks/useDataExplorerData";

// reuse core client-side helpers (or keep local if you already copied)
import { useClientSideGrouping } from "../../../core-dashboard/data-explorer/hooks/useClientSideGrouping";
import { useClientSideSort } from "../../../core-dashboard/data-explorer/hooks/useClientSideSort";
import type {
  ColumnFilters,
  DataExplorerDensity,
  DataExplorerGroupedItem,
  DataExplorerProps,
  DataExplorerRow,
  DataExplorerSortConfig,
  DataExplorerViewMode,
} from "./types";

const DataExplorer = ({
  filters = { provider: "All", service: "All", region: "All" },
  api,
  caps,
}: DataExplorerProps) => {
  const { user } = useAuthStore();
  const isLocked = !user?.is_premium;

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState<DataExplorerRow | null>(null);

  const [sortConfig, setSortConfig] = useState<DataExplorerSortConfig>({ key: null, direction: "asc" });
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [density, setDensity] = useState<DataExplorerDensity>("compact");
  const [showDataBars, setShowDataBars] = useState(true);

  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const [viewMode, setViewMode] = useState<DataExplorerViewMode>("table"); // 'table' | 'pivot'
  const [groupByCol, setGroupByCol] = useState<string | null>(null);

  // debounced column filters
  const [filterInputs, setFilterInputs] = useState<ColumnFilters>({});
  const columnFilters = useDebouncedObject(filterInputs, 300);

  // backend data
  const {
    loading,
    isInitialLoad,
    isFiltering,
    data,
    totalCount,
    allColumns,
    quickStats,
    summaryData,
    columnMaxValues,
  } = useDataExplorerData({
    api,
    caps,
    filters,
    currentPage,
    rowsPerPage,
    sortConfig,
    columnFilters,
  });

  // visible columns
  const visibleColumns = useMemo(() => {
    let cols = (allColumns || []).filter((c: string) => !hiddenColumns.includes(c));
    if (searchTerm?.trim()) {
      const q = searchTerm.trim().toLowerCase();
      cols = cols.filter((c: string) => c.toLowerCase().includes(q));
    }
    return cols;
  }, [allColumns, hiddenColumns, searchTerm]);

  const resetPagingSelection = useCallback(() => {
    setCurrentPage(1);
    setSelectedIndices(new Set<number>());
  }, []);

  // pivot grouping (client side)
  const clientSideGroupedData = useClientSideGrouping({ data, groupByCol, allColumns });

  // client-side sort for instant feedback
  const tableDataToRender = useClientSideSort({ data, sortConfig });

  const totalPages = useMemo(
    () => Math.ceil((totalCount || 0) / rowsPerPage),
    [totalCount, rowsPerPage]
  );

  // actions
  const toggleColumn = useCallback((col: string) => {
    setHiddenColumns((prev: string[]) => (prev.includes(col) ? prev.filter((c: string) => c !== col) : [...prev, col]));
  }, []);

  const handleRowSelect = useCallback((globalIndex: number) => {
    setSelectedIndices((prev: Set<number>) => {
      const s = new Set(prev);
      if (s.has(globalIndex)) s.delete(globalIndex);
      else s.add(globalIndex);
      return s;
    });
  }, []);

  const handleRowClick = useCallback((row: DataExplorerRow) => setSelectedRow(row), []);

  const getRowHeight = useCallback(() => {
    if (density === "compact") return "py-1.5";
    if (density === "standard") return "py-3";
    return "py-5";
  }, [density]);

  const getColumnWidth = useCallback(
    (index: number) => {
      if (index === 0) return 50;
      const colName = visibleColumns[index - 1]?.toLowerCase() || "";
      if (colName.includes("id") && !colName.includes("sku")) return 260;
      if (colName.includes("tags") || colName.includes("name")) return 300;
      if (colName.includes("cost") || colName.includes("price")) return 150;
      return 180;
    },
    [visibleColumns]
  );

  const removeFilter = useCallback((key: string) => {
    setFilterInputs((prev: ColumnFilters) => {
      const next: ColumnFilters = { ...prev };
      delete next[key];
      return next;
    });
    resetPagingSelection();
  }, [resetPagingSelection]);

  const resetFilters = useCallback(() => {
    if (viewMode === "pivot") {
      if (groupByCol !== null) setGroupByCol(null);
      return;
    }

    const hasSearch = searchTerm.trim().length > 0;
    const hasSort = sortConfig.key !== null;
    const hasHiddenCols = hiddenColumns.length > 0;
    const hasSelections = selectedIndices.size > 0;
    const hasInputs = Object.keys(filterInputs).length > 0;
    const isNotPage1 = currentPage !== 1;
    const hasGroupBy = groupByCol !== null;

    if (hasSearch) setSearchTerm("");
    if (hasSort) setSortConfig({ key: null, direction: "asc" });
    if (hasHiddenCols) setHiddenColumns([]);
    if (hasSelections) setSelectedIndices(new Set<number>());
    if (hasInputs) setFilterInputs({});
    if (hasGroupBy) setGroupByCol(null);
    if (isNotPage1) setCurrentPage(1);
  }, [
    viewMode,
    groupByCol,
    searchTerm,
    sortConfig,
    hiddenColumns,
    selectedIndices,
    filterInputs,
    currentPage,
  ]);

  const setFilterInputsWithReset = useCallback((updater: React.SetStateAction<ColumnFilters>) => {
    setFilterInputs(updater);
    resetPagingSelection();
  }, [resetPagingSelection]);

  const setViewModeWithReset = useCallback((next: React.SetStateAction<DataExplorerViewMode>) => {
    setViewMode((prev: DataExplorerViewMode) =>
      typeof next === "function"
        ? (next as (prevState: DataExplorerViewMode) => DataExplorerViewMode)(prev)
        : next
    );
    resetPagingSelection();
  }, [resetPagingSelection]);

  const setGroupByWithReset = useCallback((next: React.SetStateAction<string | null>) => {
    setGroupByCol((prev: string | null) =>
      typeof next === "function"
        ? (next as (prevState: string | null) => string | null)(prev)
        : next
    );
    resetPagingSelection();
  }, [resetPagingSelection]);

  const handleDrillDown = useCallback(
    (group: DataExplorerGroupedItem) => {
      const raw = group?.rawValue;
      const filterVal = raw === null || raw === undefined || raw === "" ? "null" : String(raw);
      const groupKey = String(groupByCol);
      setFilterInputs((prev: ColumnFilters) => ({ ...prev, [groupKey]: filterVal }));
      setViewMode("table");
    },
    [groupByCol]
  );

  return (
    <DataExplorerView
      // meta
      api={api}
      caps={caps}
      loading={loading}
      isInitialLoad={isInitialLoad}
      isFiltering={isFiltering}
      data={data}
      totalCount={totalCount}
      allColumns={allColumns}
      quickStats={quickStats}
      summaryData={summaryData}
      columnMaxValues={columnMaxValues}
      totalPages={totalPages}
      // lock
      isLocked={isLocked}
      // UI
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      selectedRow={selectedRow}
      setSelectedRow={setSelectedRow}
      sortConfig={sortConfig}
      setSortConfig={setSortConfig}
      filterInputs={filterInputs}
      setFilterInputs={setFilterInputsWithReset}
      columnFilters={columnFilters}
      showFilterRow={showFilterRow}
      setShowFilterRow={setShowFilterRow}
      hiddenColumns={hiddenColumns}
      showColumnMenu={showColumnMenu}
      setShowColumnMenu={setShowColumnMenu}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      rowsPerPage={rowsPerPage}
      setRowsPerPage={setRowsPerPage}
      density={density}
      setDensity={setDensity}
      showDataBars={showDataBars}
      setShowDataBars={setShowDataBars}
      selectedIndices={selectedIndices}
      setSelectedIndices={setSelectedIndices}
      viewMode={viewMode}
      setViewMode={setViewModeWithReset}
      groupByCol={groupByCol}
      setGroupByCol={setGroupByWithReset}
      // derived
      visibleColumns={visibleColumns}
      tableDataToRender={tableDataToRender}
      clientSideGroupedData={clientSideGroupedData}
      // actions
      getRowHeight={getRowHeight}
      getColumnWidth={getColumnWidth}
      toggleColumn={toggleColumn}
      handleRowSelect={handleRowSelect}
      handleRowClick={handleRowClick}
      removeFilter={removeFilter}
      resetFilters={resetFilters}
      handleDrillDown={handleDrillDown}
      // backend export passthrough
      filters={filters}
    />
  );
};

export default DataExplorer;
