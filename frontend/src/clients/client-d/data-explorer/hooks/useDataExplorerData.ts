// frontend/clients/client-d/dashboards/overview/data-explorer/hooks/useDataExplorerData.js
import { useEffect, useRef, useState } from "react";
import type {
  ApiLikeError,
  ColumnFilters,
  ColumnMaxValues,
  DataExplorerPayload,
  DataExplorerQuickStats,
  DataExplorerRow,
  SummaryData,
  UseDataExplorerDataParams,
  UseDataExplorerDataResult,
} from "../types";
import type { ApiCallOptions } from "../../../../services/apiClient";

export const useDataExplorerData = ({
  api,
  caps,
  filters,
  currentPage,
  rowsPerPage,
  sortConfig,
  columnFilters,
}: UseDataExplorerDataParams): UseDataExplorerDataResult => {
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const [data, setData] = useState<DataExplorerRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [quickStats, setQuickStats] = useState<DataExplorerQuickStats | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData>({});
  const [columnMaxValues, setColumnMaxValues] = useState<ColumnMaxValues>({});

  const prevColumnFiltersRef = useRef<ColumnFilters>({});
  const prevPageRef = useRef(currentPage);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      const prevKeys = Object.keys(prevColumnFiltersRef.current).sort().join(",");
      const currKeys = Object.keys(columnFilters || {}).sort().join(",");
      const prevValues = Object.values(prevColumnFiltersRef.current).sort().join("|");
      const currValues = Object.values(columnFilters || {}).sort().join("|");

      const filterChanged = (prevKeys !== currKeys || prevValues !== currValues) && !isInitialLoad;
      const pageChanged = prevPageRef.current !== currentPage && !isInitialLoad;

      if (isInitialLoad || pageChanged) setLoading(true);
      else if (filterChanged) setIsFiltering(true);

      try {
        if (!api || !caps) return;

        const endpointDef =
          caps?.modules?.["overview"]?.enabled &&
          caps?.modules?.["overview"]?.endpoints?.["dataExplorer"];

        if (!endpointDef) return;

        const requestOptions = {
          params: {
            provider: filters?.provider !== "All" ? filters.provider : undefined,
            service: filters?.service !== "All" ? filters.service : undefined,
            region: filters?.region !== "All" ? filters.region : undefined,
            page: currentPage,
            limit: rowsPerPage,
            sortBy: sortConfig?.key || undefined,
            sortOrder: sortConfig?.direction || "asc",
            // If your backend later supports it:
            // columnFilters,
          },
          signal: abortController.signal,
        } as unknown as ApiCallOptions;

        const body = (await api.call<unknown>("overview", "dataExplorer", requestOptions)) as
          | DataExplorerPayload
          | null
          | undefined;

        if (!isMounted) return;

        if (body) {
          setData(body.data || []);
          setTotalCount(body.pagination?.total || 0);
          setAllColumns(body.allColumns || []);
          setQuickStats(body.quickStats || null);
          setSummaryData(body.summaryData || {});
          setColumnMaxValues(body.columnMaxValues || {});
        }
      } catch (err: unknown) {
        const apiError = err as ApiLikeError;
        if (apiError?.code === "NOT_SUPPORTED") return;
        if (isMounted && apiError?.name !== "AbortError") {
          console.error("Error fetching data explorer data:", apiError);
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
