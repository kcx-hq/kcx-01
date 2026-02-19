// frontend/core/dashboards/overview/data-explorer/hooks/useDataExplorerData.js

import { useEffect, useRef, useState } from "react";

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
  const [isPaginating, setIsPaginating] = useState(false);

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
      // FIX: Use JSON.stringify for accurate comparison of filter objects.
      // The previous logic (sorting values independently) could fail if values were swapped between columns.
      const prevFiltersStr = JSON.stringify(prevColumnFiltersRef.current || {});
      const currFiltersStr = JSON.stringify(columnFilters || {});
      
      const filterChanged = (prevFiltersStr !== currFiltersStr) && !isInitialLoad;
      const pageChanged = prevPageRef.current !== currentPage && !isInitialLoad;

      // Keep table visible during pagination; only use full loading on first load.
      if (isInitialLoad) setLoading(true);
      else if (filterChanged) setIsFiltering(true);
      else if (pageChanged) setIsPaginating(true);

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
            // Pass columnFilters
            columnFilters: Object.keys(columnFilters || {}).length 
              ? JSON.stringify(columnFilters) 
              : undefined,
          },
          signal: abortController.signal,
        });

        const payload = res?.data?.data || res?.data;

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
        setIsPaginating(false);
        if (isInitialLoad) setIsInitialLoad(false);
        // Update refs
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
    isPaginating,
    data,
    totalCount,
    allColumns,
    quickStats,
    summaryData,
    columnMaxValues,
  };
};
