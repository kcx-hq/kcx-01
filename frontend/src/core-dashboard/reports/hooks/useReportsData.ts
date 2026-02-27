import { useEffect, useState } from "react";
import { buildReportParams } from "../utils/reportUtils";
import type {
  ApiLikeError,
  ReportsOptimizationData,
  ReportsSummaryData,
  UseReportsDataParams,
  UseReportsDataResult,
} from "../types";

export function useReportsData({ api, caps, filters }: UseReportsDataParams): UseReportsDataResult {
  const [fetchingData, setFetchingData] = useState(true);
  const [reportData, setReportData] = useState<ReportsSummaryData | null>(null);
  const [optimizationData, setOptimizationData] = useState<ReportsOptimizationData | null>(null);

  useEffect(() => {
    if (!api || !caps) return;

    const fetchData = async () => {
      setFetchingData(true);
      try {
        const params = buildReportParams(filters);

        const canSummary = !!caps?.modules?.["reports"]?.endpoints?.["summary"];
        const canOptimization = !!caps?.modules?.["optimization"]?.endpoints?.["recommendations"];

        const [summaryRes, optimizationRes] = await Promise.all([
          canSummary
            ? api.call<{ data?: ReportsSummaryData }>("reports", "summary", { params })
            : Promise.resolve(null),
          canOptimization
            ? api.call<{ data?: ReportsOptimizationData }>("optimization", "recommendations", { params })
            : Promise.resolve(null),
        ]);

        const summaryData = summaryRes?.data ?? summaryRes;
        const optData = optimizationRes?.data ?? optimizationRes;

        if (summaryData) setReportData(summaryData as ReportsSummaryData);
        if (optData) setOptimizationData(optData as ReportsOptimizationData);
      } catch (err: unknown) {
        const error = err as ApiLikeError;
        console.error("Error fetching report data:", error);
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, [api, caps, filters]);

  return { fetchingData, reportData, optimizationData };
}



