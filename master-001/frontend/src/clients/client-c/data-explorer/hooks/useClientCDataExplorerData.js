import { useEffect, useRef, useState } from "react";

/**
 * Fetches client-c data explorer payload from backend.
 * - Shows full loader only for initial load or page changes
 * - Shows subtle "isFiltering" when backend filters change
 */
export const useClientCDataExplorerData = ({
  api,
  caps,
  filters,
  currentPage,
  rowsPerPage,
  sortConfig,
  columnFilters,
  uploadId
}) => {
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [allColumns, setAllColumns] = useState([]);
  const [quickStats, setQuickStats] = useState(null);
  const [summaryData, setSummaryData] = useState({});
  const [columnMaxValues, setColumnMaxValues] = useState({});
  const [departmentBreakdown, setDepartmentBreakdown] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState(['All']);

  const prevColumnFiltersRef = useRef({});
  const prevPageRef = useRef(currentPage);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      // detect filter change
      const prevKeys = Object.keys(prevColumnFiltersRef.current).sort().join(",");
      const currKeys = Object.keys(columnFilters || {}).sort().join(",");
      const prevValues = Object.values(prevColumnFiltersRef.current).sort().join("|");
      const currValues = Object.values(columnFilters || {}).sort().join("|");

      const filterChanged =
        (prevKeys !== currKeys || prevValues !== currValues) && !isInitialLoad;

      const pageChanged = prevPageRef.current !== currentPage && !isInitialLoad;

      if (isInitialLoad || pageChanged) setLoading(true);
      else if (filterChanged) setIsFiltering(true);

      try {
        if (!api || !caps) return;

        // Check if dataExplorer module is enabled
        const isDataExplorerEnabled = caps?.modules?.dataExplorer?.enabled === true;
        if (!isDataExplorerEnabled) {
          console.warn('DataExplorer module is not enabled');
          return;
        }

        // Use the correct endpoint path for client-c data explorer
        const res = await api.call("dataExplorer", "dataExplorer", {
          params: {
            provider: filters?.provider !== "All" ? filters.provider : undefined,
            service: filters?.service !== "All" ? filters.service : undefined,
            region: filters?.region !== "All" ? filters.region : undefined,
            page: currentPage,
            limit: rowsPerPage,
            sortBy: sortConfig?.key || undefined,
            sortOrder: sortConfig?.direction || "asc",
            uploadId: uploadId
          },
          signal: abortController.signal,
        });

        if (!isMounted) return;

        if (res?.success && res?.data) {
          setData(res.data.data || []);
          setTotalCount(res.data.total || res.data.totalCount || 0);
          setAllColumns(res.data.allColumns || []);
          setQuickStats(res.data.quickStats || null);
          setSummaryData(res.data.summaryData || {});
          setColumnMaxValues(res.data.columnMaxValues || {});
          setDepartmentBreakdown(res.data.departmentBreakdown || []);
          setAvailableDepartments(res.data.availableDepartments || ['All']);
        } else {
          // Handle fallback case
          setData([]);
          setTotalCount(0);
          setAllColumns([]);
          setQuickStats(null);
          setSummaryData({});
          setColumnMaxValues({});
          setDepartmentBreakdown([]);
          setAvailableDepartments(['All']);
        }
      } catch (err) {
        if (err?.code === "NOT_SUPPORTED") return;
        if (isMounted && err?.name !== "AbortError") {
          console.error("Error fetching client-c data explorer data:", err);
        }
      } finally {
        if (!isMounted) return;
        setLoading(false);
        setIsFiltering(false);
        if (isInitialLoad) setIsInitialLoad(false);
        prevColumnFiltersRef.current = { ...(columnFilters || {}) };
        prevPageRef.current = currentPage;
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [api, caps, filters, currentPage, rowsPerPage, sortConfig, columnFilters, uploadId, isInitialLoad]);

  return {
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
  };
};