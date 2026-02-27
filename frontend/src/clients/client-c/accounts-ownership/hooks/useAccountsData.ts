import { useEffect, useRef, useState } from "react";
import type { ApiClient, Capabilities } from "../../../../services/apiClient";
import type { AccountsFilters, AccountsRawData, ApiLikeError, UseAccountsDataResult } from "../types";

export const useAccountsData = (
  api: ApiClient | null,
  caps: Capabilities | null,
  debouncedFilters: AccountsFilters,
  forceRefreshKey: number,
): UseAccountsDataResult => {
  const [accountsData, setAccountsData] = useState<AccountsRawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef(debouncedFilters);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!api || !caps) return;

    // Cancel previous request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const filtersChanged =
      JSON.stringify(prevFiltersRef.current) !== JSON.stringify(debouncedFilters);

    const isFilterChange = filtersChanged && !isInitialMount.current;

    const fetchData = async () => {
      // Loading behavior
      if (isInitialMount.current) {
        setLoading(true);
        isInitialMount.current = false;
      } else if (isFilterChange) {
        setIsFiltering(true);
      } else {
        setLoading(true);
      }

      try {
        const endpointDef =
          caps?.modules?.["governance"]?.enabled &&
          caps?.modules?.["governance"]?.endpoints?.["accounts"];

        if (!endpointDef) return;

        const params: Partial<AccountsFilters> = {};
        if (debouncedFilters?.provider && debouncedFilters.provider !== "All")
          params.provider = debouncedFilters.provider;
        if (debouncedFilters?.service && debouncedFilters.service !== "All")
          params.service = debouncedFilters.service;
        if (debouncedFilters?.region && debouncedFilters.region !== "All")
          params.region = debouncedFilters.region;

        const payload = await api.call<AccountsRawData>("governance", "accounts", { params });

        if (!abortControllerRef.current?.signal.aborted && payload) {
          setAccountsData(payload);
          prevFiltersRef.current = { ...debouncedFilters };
        }
      } catch (error: unknown) {
        const err = error as ApiLikeError;
        if (err?.code !== "NOT_SUPPORTED") {
          if (err?.name !== "AbortError" && !abortControllerRef.current?.signal.aborted) {
            console.error("Error fetching accounts data:", err);
          }
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
          setIsFiltering(false);
        }
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
    // forceRefreshKey triggers fetch even if filters stayed same (reset)
  }, [api, caps, debouncedFilters, forceRefreshKey]);

  return { accountsData, loading, isFiltering };
};
