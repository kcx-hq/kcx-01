import { useEffect, useState } from "react";
import { buildReportParams } from "../../../../core-dashboard/reports/utils/reportUtils";
import type {
  ClientDReportData,
  ReportMetricItem,
  UseReportsDataParams,
  UseReportsDataResult,
} from "../types";

/**
 * Client-D Reports data:
 * - /reports/summary
 * - /reports/top-services
 * - /reports/top-regions
 *
 * Output: reportData merged into one object for the view.
 */
export function useReportsData({ api, caps, filters }: UseReportsDataParams): UseReportsDataResult {
  const [fetchingData, setFetchingData] = useState(true);
  const [reportData, setReportData] = useState<ClientDReportData | null>(null);

  useEffect(() => {
    if (!api || !caps) return;
    if (!caps.modules?.["reports"]?.enabled) return;

    const fetchData = async () => {
      setFetchingData(true);

      try {
        const params = buildReportParams(filters);

        const canSummary = !!caps?.modules?.["reports"]?.endpoints?.["summary"];
        const canTopServices = !!caps?.modules?.["reports"]?.endpoints?.["topServices"];
        const canTopRegions = !!caps?.modules?.["reports"]?.endpoints?.["topRegions"];

        const [summaryRes, servicesRes, regionsRes] = await Promise.all([
          canSummary
            ? api.call<ClientDReportData>("reports", "summary", { params })
            : Promise.resolve(null),
          canTopServices
            ? api.call<ReportMetricItem[] | { data?: ReportMetricItem[] }>("reports", "topServices", { params })
            : Promise.resolve(null),
          canTopRegions
            ? api.call<ReportMetricItem[] | { data?: ReportMetricItem[] }>("reports", "topRegions", { params })
            : Promise.resolve(null),
        ]);

        const summary = (summaryRes ?? {}) as ClientDReportData;

        const topServicesFromEndpoint =
          !Array.isArray(servicesRes) && Array.isArray(servicesRes?.data)
            ? (servicesRes.data as ReportMetricItem[])
            : Array.isArray(servicesRes)
            ? (servicesRes as ReportMetricItem[])
            : [];

        const topRegionsFromEndpoint =
          !Array.isArray(regionsRes) && Array.isArray(regionsRes?.data)
            ? (regionsRes.data as ReportMetricItem[])
            : Array.isArray(regionsRes)
            ? (regionsRes as ReportMetricItem[])
            : [];

        const merged: ClientDReportData = {
          ...summary,
          topServices:
            Array.isArray(summary?.topServices) && summary.topServices.length
              ? summary.topServices
              : topServicesFromEndpoint,
          topRegions:
            Array.isArray(summary?.topRegions) && summary.topRegions.length
              ? summary.topRegions
              : topRegionsFromEndpoint,
        };

        setReportData(merged);
      } catch (err: unknown) {
        console.error("Client-D: Error fetching reports:", err);
        setReportData(null);
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, [api, caps, filters]);

  return { fetchingData, reportData };
}
