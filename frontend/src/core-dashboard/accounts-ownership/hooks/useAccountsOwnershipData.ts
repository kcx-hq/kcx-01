import { useEffect, useRef, useState } from "react";
import { buildAccountsParams, normalizeAccountsResponse } from "../utils/buildParams";
import type {
  AccountsApiFilters,
  AccountsOwnershipData,
  ApiLikeError,
  UseAccountsOwnershipDataParams,
  UseAccountsOwnershipDataResult,
} from "../types";

export function useAccountsOwnershipData({
  api,
  caps,
  debouncedFilters,
}: UseAccountsOwnershipDataParams): UseAccountsOwnershipDataResult {
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef<AccountsApiFilters | null>(null);
  const isInitialMount = useRef(true);

  const [accountsData, setAccountsData] = useState<AccountsOwnershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !caps) return;
    if (!caps.modules?.["governance"]?.enabled) return;

    // cancel in-flight request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const fetchData = async () => {
      if (isInitialMount.current) {
        setLoading(true);
        isInitialMount.current = false;
      } else {
        setIsFiltering(true);
      }

      setError(null);

      try {
        const params = buildAccountsParams({ debouncedFilters });

        const res = await api.call<unknown>("governance", "accounts", { params });

        if (abortControllerRef.current?.signal.aborted) return;

        const normalized = normalizeAccountsResponse(res);
        setAccountsData(normalized);
        prevFiltersRef.current = { ...debouncedFilters };
      } catch (err: unknown) {
        const apiErr = err as ApiLikeError;

        if (apiErr?.code === "NOT_SUPPORTED") return;
        if (apiErr?.name === "AbortError") return;

        console.error("Error fetching accounts data:", apiErr);

        if (apiErr?.response?.status === 401) {
          setError("Your session has expired. Please refresh the page or log in again.");
        } else {
          setError(`Failed to load accounts data: ${apiErr?.message || "Unknown error"}`);
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
  }, [api, caps, debouncedFilters]);

  return { accountsData, loading, isFiltering, error };
}
