// frontend/core/dashboards/overview/data-explorer/hooks/useDataExplorerData.js

import { useEffect, useRef, useState } from "react";
import type {
  ApiLikeError,
  DataExplorerRow,
  DataExplorerSortConfig,
  UseDataExplorerDataParams,
  UseDataExplorerDataResult,
} from "../types";

interface DataExplorerApiResponse {
  data?: DataExplorerRow[];
  pagination?: { total?: number };
  allColumns?: string[];
  quickStats?: { totalCost: number; avgCost: number };
  summaryData?: Record<string, number | string | undefined>;
  columnMaxValues?: Record<string, number>;
  [key: string]: unknown;
}

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
  const [isPaginating, setIsPaginating] = useState(false);

  const [data, setData] = useState<DataExplorerRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [quickStats, setQuickStats] = useState<{ totalCost: number; avgCost: number } | null>(null);
  const [summaryData, setSummaryData] = useState<Record<string, number | string | undefined>>({});
  const [columnMaxValues, setColumnMaxValues] = useState<Record<string, number>>({});

  const prevColumnFiltersRef = useRef<Record<string, string>>({});
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
          caps?.modules?.["overview"]?.enabled &&
          caps?.modules?.["overview"]?.endpoints?.["dataExplorer"];

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
        } as unknown as Parameters<NonNullable<typeof api>["call"]>[2]);

        const payload = (res as DataExplorerApiResponse | null | undefined) ?? null;

        if (!isMounted) return;

        if (!payload) return;

        setData(payload.data || []);
        setTotalCount(payload.pagination?.total || 0);
        setAllColumns(payload.allColumns || []);
        setQuickStats(payload.quickStats || null);
        setSummaryData(payload.summaryData || {});
        setColumnMaxValues(payload.columnMaxValues || {});
      } catch (err: unknown) {
        const error = err as ApiLikeError;
        if (error?.code === "NOT_SUPPORTED") return;
        if (isMounted && error?.name !== "AbortError") {
          console.error("Error fetching data explorer data:", error);
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



