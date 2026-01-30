import { useEffect, useRef, useState } from "react";

/**
 * Fetches data explorer payload from backend.
 * - Shows full loader only for initial load or page changes
 * - Shows subtle "isFiltering" when backend filters change
 */
export const useDataExplorerData = ({
  api,
  caps,
  filters,
  currentPage,
  rowsPerPage,
  sortConfig,
  columnFilters,
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

        const endpointDef =
          caps?.modules?.overview?.enabled &&
          caps?.modules?.overview?.endpoints?.dataExplorer;

        if (!endpointDef) return;

        const res = await api.call("overview", "dataExplorer", {
          params: {
            provider: filters?.provider !== "All" ? filters.provider : undefined,
            service: filters?.service !== "All" ? filters.service : undefined,
            region: filters?.region !== "All" ? filters.region : undefined,
            page: currentPage,
            limit: rowsPerPage,
            sortBy: sortConfig?.key || undefined,
            sortOrder: sortConfig?.direction || "asc",
            // NOTE: your backend currently doesn't accept columnFilters in params in your snippet.
            // If backend supports it, uncomment:
            // columnFilters,
          },
          signal: abortController.signal,
        });

        const payload = res?.data?.data || res?.data; // tolerate different shapes

        if (!isMounted) return;

        if (res?.success && res?.data) {
          setData(res.data.data || []);
          setTotalCount(res.data.pagination?.total || 0);
          setAllColumns(res.data.allColumns || []);
          setQuickStats(res.data.quickStats || null);
          setSummaryData(res.data.summaryData || {});
          setColumnMaxValues(res.data.columnMaxValues || {});
        } else if (payload) {
          setData(payload.data || []);
          setTotalCount(payload.pagination?.total || 0);
          setAllColumns(payload.allColumns || []);
          setQuickStats(payload.quickStats || null);
          setSummaryData(payload.summaryData || {});
          setColumnMaxValues(payload.columnMaxValues || {});
        }
      } catch (err) {
        if (err?.code === "NOT_SUPPORTED") return;
        if (isMounted && err?.name !== "AbortError") {
          console.error("Error fetching data explorer data:", err);
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
  }, [api, caps, filters, currentPage, rowsPerPage, sortConfig, columnFilters, isInitialLoad]);

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
  };
};
