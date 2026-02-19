import { useEffect, useRef, useState } from "react";
import { buildAccountsParams, normalizeAccountsResponse } from "../utils/buildParams";

export function useAccountsOwnershipData({ api, caps, debouncedFilters, uploadId }) {
  const abortControllerRef = useRef(null);
  const prevFiltersRef = useRef(null);
  const isInitialMount = useRef(true);

  const [accountsData, setAccountsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!api || !caps) return;
    if (!caps.modules?.governance?.enabled) return;

    // cancel in-flight request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(debouncedFilters);
    const isFilterChange = filtersChanged && !isInitialMount.current;

    const fetchData = async () => {
      if (isInitialMount.current) {
        setLoading(true);
        isInitialMount.current = false;
      } else {
        setIsFiltering(true);
      }

      setError(null);

      try {
        const params = buildAccountsParams({ debouncedFilters, uploadId });

        const res = await api.call("governance", "accounts", { params });

        if (abortControllerRef.current?.signal.aborted) return;

        const normalized = normalizeAccountsResponse(res);
        setAccountsData(normalized);
        prevFiltersRef.current = { ...debouncedFilters };
      } catch (err) {
        if (err?.code === "NOT_SUPPORTED") return;
        if (err?.name === "AbortError") return;

        // eslint-disable-next-line no-console
        console.error("Error fetching accounts data:", err);

        if (err?.response?.status === 401) {
          setError("Your session has expired. Please refresh the page or log in again.");
        } else {
          setError(`Failed to load accounts data: ${err?.message || "Unknown error"}`);
        }

        prevFiltersRef.current = { ...debouncedFilters };
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
  }, [api, caps, debouncedFilters, uploadId]);

  return { accountsData, loading, isFiltering, error };
}
