import React, { useMemo, useState, useCallback } from "react";
import { useAuthStore } from "../../store/Authstore";
import DataExplorerView from "./DataExplorerView.jsx";
import { useDebouncedObject } from "./hooks/useDebouncedObject.js";
import { useDataExplorerData } from "./hooks/useDataExplorerData.js";
import { useClientSideGrouping } from "./hooks/useClientSideGrouping.js";
import { useClientSideSort } from "./hooks/useClientSideSort.js";

const DataExplorer = (
  { filters = { provider: "All", service: "All", region: "All" }, api, caps }
) => {
  const { user } = useAuthStore();

  // LOCK when user is NOT premium
  const isLocked = !user?.is_premium;

  // --- UI STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [density, setDensity] = useState("compact");
  const [showDataBars, setShowDataBars] = useState(true);

  const [selectedIndices, setSelectedIndices] = useState(new Set());

  const [viewMode, setViewMode] = useState("table"); // 'table' | 'pivot'
  const [groupByCol, setGroupByCol] = useState(null);

  // --- FILTER INPUTS (debounced into columnFilters) ---
  const [filterInputs, setFilterInputs] = useState({});
  const columnFilters = useDebouncedObject(filterInputs, 300);

  // --- DATA FROM BACKEND ---
  const {
    loading,
    isInitialLoad,
    isFiltering,
    isPaginating,
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
    sortConfig, // sent to backend for consistency
    columnFilters,
  });

  // visible columns (hide + column search)
  const visibleColumns = useMemo(() => {
    let cols = (allColumns || []).filter((c) => !hiddenColumns.includes(c));
    if (searchTerm?.trim()) {
      const q = searchTerm.trim().toLowerCase();
      cols = cols.filter((c) => c.toLowerCase().includes(q));
    }
    return cols;
  }, [allColumns, hiddenColumns, searchTerm]);

  // reset to page 1 on backend filters change
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedIndices(new Set());
  }, [columnFilters, groupByCol, viewMode]);

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
  const toggleColumn = useCallback((col) => {
    setHiddenColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  }, []);

  const handleRowSelect = useCallback((globalIndex) => {
    setSelectedIndices((prev) => {
      const s = new Set(prev);
      if (s.has(globalIndex)) s.delete(globalIndex);
      else s.add(globalIndex);
      return s;
    });
  }, []);

  const handleRowClick = useCallback((row) => setSelectedRow(row), []);

  const getRowHeight = useCallback(() => {
    if (density === "compact") return "py-1.5";
    if (density === "standard") return "py-3";
    return "py-5";
  }, [density]);

  const getColumnWidth = useCallback(
    (index) => {
      if (index === 0) return 50;
      const colName = visibleColumns[index - 1]?.toLowerCase() || "";
      if (colName.includes("id") && !colName.includes("sku")) return 260;
      if (colName.includes("tags") || colName.includes("name")) return 300;
      if (colName.includes("cost") || colName.includes("price")) return 150;
      return 180;
    },
    [visibleColumns]
  );

  const removeFilter = useCallback((key) => {
    setFilterInputs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

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
    if (hasSelections) setSelectedIndices(new Set());
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

  const handleDrillDown = useCallback(
    (group) => {
      const raw = group?.rawValue;
      const filterVal =
        raw === null || raw === undefined || raw === "" ? "null" : String(raw);
      setFilterInputs((prev) => ({ ...prev, [groupByCol]: filterVal }));
      setViewMode("table");
    },
    [groupByCol]
  );

  return (
    <DataExplorerView
      // data + meta
      api={api}
      caps={caps}
      loading={loading}
      isInitialLoad={isInitialLoad}
      isFiltering={isFiltering}
      isPaginating={isPaginating}
      data={data}
      totalCount={totalCount}
      allColumns={allColumns}
      quickStats={quickStats}
      summaryData={summaryData}
      columnMaxValues={columnMaxValues}
      totalPages={totalPages}
      // UI state
      isLocked={isLocked}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      selectedRow={selectedRow}
      setSelectedRow={setSelectedRow}
      sortConfig={sortConfig}
      setSortConfig={setSortConfig}
      filterInputs={filterInputs}
      setFilterInputs={setFilterInputs}
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
      setViewMode={setViewMode}
      groupByCol={groupByCol}
      setGroupByCol={setGroupByCol}
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
    />
  );
};

export default DataExplorer;
