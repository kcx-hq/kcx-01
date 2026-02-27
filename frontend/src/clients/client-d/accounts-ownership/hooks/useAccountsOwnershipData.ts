import { useEffect, useRef, useState } from "react";
import { buildAccountsParams } from "../utils/buildParams";
import { normalizeTagCoverageResponse } from "../utils/normalizeTagCoverageResponse";
import type {
  ApiLikeError,
  TagCoverageData,
  UseAccountsOwnershipDataParams,
  UseAccountsOwnershipDataResult,
} from "../types";

/**
 * Client-D: Governance -> Tag Coverage endpoint hook
 * Expected response:
 * {
 *  success: true,
 *  data: { taggedCost, untaggedCost, taggedPercent, untaggedPercent, missingTags: [] }
 * }
 */
export function useAccountsOwnershipData({
  api,
  caps,
  debouncedFilters,
  uploadId,
}: UseAccountsOwnershipDataParams): UseAccountsOwnershipDataResult {
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef<Record<string, unknown> | null>(null);
  const isInitialMount = useRef(true);

  const [accountsData, setAccountsData] = useState<TagCoverageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !caps) return;
    if (!caps.modules?.["governance"]?.enabled) return;

    // cancel in-flight
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const filtersChanged =
      JSON.stringify(prevFiltersRef.current) !== JSON.stringify(debouncedFilters);

    const fetchData = async () => {
      if (isInitialMount.current) {
        setLoading(true);
        isInitialMount.current = false;
      } else if (filtersChanged) {
        setIsFiltering(true);
      }

      setError(null);

      try {
        const params = buildAccountsParams({
          debouncedFilters,
          ...(uploadId ? { uploadId } : {}),
        });

        /**
         * IMPORTANT:
         * Replace this call path to match YOUR backend:
         *
         * Option A (same key as before): api.call("governance", "accounts", { params })
         * Option B (more correct for this response): api.call("governance", "tag-coverage", { params })
         *
         * I’m using "tag-coverage" since response is tag coverage, not accounts list.
         */
        const res = await api.call("governance", "compliance", { params });

        if (abortControllerRef.current?.signal.aborted) return;

        const normalized = normalizeTagCoverageResponse(res);
        setAccountsData(normalized);
        prevFiltersRef.current = { ...debouncedFilters };
      } catch (err: unknown) {
        const apiError = err as ApiLikeError;
        if (apiError?.code === "NOT_SUPPORTED") return;
        if (apiError?.name === "AbortError") return;

        console.error("Error fetching tag coverage:", apiError);

        if (apiError?.status === 401) {
          setError("Your session has expired. Please refresh the page or log in again.");
        } else {
          setError(`Failed to load tag coverage: ${apiError?.message || "Unknown error"}`);
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
