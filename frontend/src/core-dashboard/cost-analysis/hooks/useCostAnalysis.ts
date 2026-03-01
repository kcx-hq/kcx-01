import { useEffect, useRef, useState } from "react";
import { useDashboardStore } from "../../../store/Dashboard.store";
import {
  CostAnalysisApiClient,
  CostAnalysisApiData,
  CostAnalysisCaps,
  SpendAnalyticsFilters,
  isObjectRecord,
} from "../types";

interface UseCostAnalysisArgs {
  api: CostAnalysisApiClient | null | undefined;
  caps: CostAnalysisCaps | null | undefined;
  filters: SpendAnalyticsFilters;
}

interface UseCostAnalysisResult {
  loading: boolean;
  isRefreshing: boolean;
  apiData: CostAnalysisApiData | null;
  error: string | null;
}

const getPayload = (response: unknown): CostAnalysisApiData | null => {
  if (!isObjectRecord(response)) return null;
  return response as CostAnalysisApiData;
};

const hasNotSupportedCode = (error: unknown): boolean =>
  isObjectRecord(error) && error.code === "NOT_SUPPORTED";

const isAbortError = (error: unknown): boolean =>
  isObjectRecord(error) && error.name === "AbortError";

export function useCostAnalysis({
  api,
  caps,
  filters,
}: UseCostAnalysisArgs): UseCostAnalysisResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiData, setApiData] = useState<CostAnalysisApiData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  const uploadIds = useDashboardStore((state) => state.uploadIds);
  const uploadIdsKey = (Array.isArray(uploadIds) ? uploadIds.join(",") : "") || "";

  useEffect(() => {
    if (!api || !caps) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const run = async (): Promise<void> => {
      if (isInitialLoadRef.current) setLoading(true);
      else setIsRefreshing(true);

      try {
        const params: Record<string, string | undefined> = {
          provider: filters.provider,
          service: filters.service,
          region: filters.region,
          account: filters.account,
          subAccount: filters.subAccount,
          app: filters.app,
          team: filters.team,
          env: filters.env,
          costCategory: filters.costCategory,
          tagKey: filters.tagKey || undefined,
          tagValue: filters.tagValue || undefined,
          timeRange: filters.timeRange,
          granularity: filters.granularity,
          compareTo: filters.compareTo,
          costBasis: filters.costBasis,
          currencyMode: filters.currencyMode,
          groupBy: filters.groupBy,
          startDate: filters.timeRange === "custom" ? filters.startDate || undefined : undefined,
          endDate: filters.timeRange === "custom" ? filters.endDate || undefined : undefined,
        };

        const response = await api.call("costAnalysis", "costAnalysis", { params });
        if (abortController.signal.aborted) return;

        const payload = getPayload(response);
        setApiData(payload);
        setError(null);
        isInitialLoadRef.current = false;
      } catch (fetchError: unknown) {
        if (hasNotSupportedCode(fetchError)) return;
        if (!isAbortError(fetchError) && !abortController.signal.aborted) {
          setError("Failed to load spend analytics data.");
          console.error("Cost analysis fetch error:", fetchError);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
          setIsRefreshing(false);
          if (isInitialLoadRef.current) isInitialLoadRef.current = false;
        }
      }
    };

    void run();

    return () => abortController.abort();
  }, [api, caps, filters, uploadIdsKey]);

  return { loading, isRefreshing, apiData, error };
}



