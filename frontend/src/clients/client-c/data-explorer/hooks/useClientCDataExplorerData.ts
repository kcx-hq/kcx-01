import { useEffect, useRef, useState } from "react";
import type {
  ApiLikeError,
  ClientCApiCallOptions,
  ClientCDataExplorerPayload,
  ClientCUseDataExplorerDataParams,
  ClientCUseDataExplorerDataResult,
  DataExplorerRow,
} from "../types";

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
}: ClientCUseDataExplorerDataParams): ClientCUseDataExplorerDataResult => {
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const [data, setData] = useState<DataExplorerRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [quickStats, setQuickStats] = useState<ClientCUseDataExplorerDataResult["quickStats"]>(null);
  const [summaryData, setSummaryData] = useState<ClientCUseDataExplorerDataResult["summaryData"]>({});
  const [columnMaxValues, setColumnMaxValues] = useState<ClientCUseDataExplorerDataResult["columnMaxValues"]>({});
  const [departmentBreakdown, setDepartmentBreakdown] = useState<ClientCUseDataExplorerDataResult["departmentBreakdown"]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>(['All']);

  const prevColumnFiltersRef = useRef<Record<string, string>>({});
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
        const isDataExplorerEnabled = caps?.modules?.["dataExplorer"]?.enabled === true;
        if (!isDataExplorerEnabled) {
          console.warn('DataExplorer module is not enabled');
          return;
        }

        // Use the correct endpoint path for client-c data explorer
        const options: ClientCApiCallOptions = {
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
        };

        const res = await api.call<ClientCDataExplorerPayload>(
          "dataExplorer",
          "dataExplorer",
          options,
        );

        if (!isMounted) return;

        const payload = res as ClientCDataExplorerPayload | undefined;

        if (payload) {
          setData(payload.data || []);
          setTotalCount(payload.total || payload.totalCount || 0);
          setAllColumns(payload.allColumns || []);
          setQuickStats(payload.quickStats || null);
          setSummaryData(payload.summaryData || {});
          setColumnMaxValues(payload.columnMaxValues || {});
          setDepartmentBreakdown(payload.departmentBreakdown || []);
          setAvailableDepartments(payload.availableDepartments || ['All']);
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
      } catch (err: unknown) {
        const apiError = err as ApiLikeError;
        if (apiError.code === "NOT_SUPPORTED") return;
        if (isMounted && apiError?.name !== "AbortError") {
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
