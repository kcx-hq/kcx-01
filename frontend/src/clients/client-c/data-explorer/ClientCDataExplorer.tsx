import React, { useMemo, useState, useCallback } from "react";
import { useDebouncedObject } from "../../../core-dashboard/data-explorer/hooks/useDebouncedObject";
import ClientCDataExplorerView from "./ClientCDataExplorerView";
import { useClientCDataExplorerData } from "./hooks/useClientCDataExplorerData";
import { useClientSideGrouping } from "./hooks/useClientSideGrouping";
import { useClientSideSort } from "./hooks/useClientSideSort";
import type {
  ClientCDataExplorerProps,
  ClientCExplorerViewMode,
  ClientCGroupedRow,
  ClientCColumnFilters,
  DataExplorerRow,
  DataExplorerSortConfig,
} from "./types";

const ClientCDataExplorer = (
  { filters = { provider: "All", service: "All", region: "All", department: "All" }, api, caps, uploadId }: ClientCDataExplorerProps
) => {
  // --- UI STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState<DataExplorerRow | null>(null);

  const [sortConfig, setSortConfig] = useState<DataExplorerSortConfig>({ key: null, direction: "asc" });
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [density, setDensity] = useState("compact");
  const [showDataBars, setShowDataBars] = useState(true);

  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set<number>());

  const [viewMode, setViewMode] = useState<ClientCExplorerViewMode>("table"); // 'table' | 'pivot'
  const [groupByCol, setGroupByCol] = useState<string | null>(null);

  // --- FILTER INPUTS (debounced into columnFilters) ---
  const [filterInputs, setFilterInputs] = useState<ClientCColumnFilters>({});
  const columnFilters = useDebouncedObject(filterInputs, 300);

  // --- DATA FROM BACKEND ---
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
    departmentBreakdown,
    availableDepartments,
  } = useClientCDataExplorerData({
    api,
    caps,
    filters,
    currentPage,
    rowsPerPage,
    sortConfig,
    columnFilters,
    uploadId
  });

  // visible columns (hide + column search)
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

  // client-side grouping for pivot view
  const clientSideGroupedData = useClientSideGrouping({
    data,
    groupByCol,
    allColumns,
  });

  // client-side sort for instant feedback
  const tableDataToRender = useClientSideSort({
    data,
    sortConfig,
  });

  const totalPages = useMemo(
    () => Math.ceil((totalCount || 0) / rowsPerPage),
    [totalCount, rowsPerPage]
  );

  // --- handlers (memoized) ---
  const toggleColumn = useCallback((col: string) => {
    setHiddenColumns((prev: string[]) =>
      prev.includes(col) ? prev.filter((c: string) => c !== col) : [...prev, col]
    );
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
      if (colName.includes("charge") || colName.includes("billed")) return 180;
      if (colName.includes("period")) return 200;
      if (colName.includes("quantity") || colName.includes("unit")) return 120;
      return 180;
    },
    [visibleColumns]
  );

  const removeFilter = useCallback((key: string) => {
    setFilterInputs((prev: ClientCColumnFilters) => {
      const next: ClientCColumnFilters = { ...prev };
      delete next[key];
      return next;
    });
    resetPagingSelection();
  }, [resetPagingSelection]);

  const resetFilters = useCallback(() => {
    // pivot reset: only reset group selection
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

  const setFilterInputsWithReset = useCallback((updater: React.SetStateAction<ClientCColumnFilters>) => {
    setFilterInputs(updater);
    resetPagingSelection();
  }, [resetPagingSelection]);

  const setViewModeWithReset = useCallback((next: React.SetStateAction<ClientCExplorerViewMode>) => {
    setViewMode((prev: ClientCExplorerViewMode) =>
      typeof next === "function"
        ? (next as (prevState: ClientCExplorerViewMode) => ClientCExplorerViewMode)(prev)
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
    (group: ClientCGroupedRow) => {
      const raw = group?.rawValue;
      const filterVal =
        raw === null || raw === undefined || raw === "" ? "null" : String(raw);
      setFilterInputs((prev: ClientCColumnFilters) => ({ ...prev, [String(groupByCol)]: filterVal }));
      setViewMode("table");
    },
    [groupByCol]
  );

  return (
    <ClientCDataExplorerView
      // data + meta
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
      departmentBreakdown={departmentBreakdown}
      availableDepartments={availableDepartments}
      totalPages={totalPages}
      // UI state
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
      // helpers + actions
      getRowHeight={getRowHeight}
      getColumnWidth={getColumnWidth}
      toggleColumn={toggleColumn}
      handleRowSelect={handleRowSelect}
      handleRowClick={handleRowClick}
      removeFilter={removeFilter}
      resetFilters={resetFilters}
      handleDrillDown={handleDrillDown}
      // passthrough for backend export
      filters={filters}
      uploadId={uploadId}
    />
  );
};

export default ClientCDataExplorer;
