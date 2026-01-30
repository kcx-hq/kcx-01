import { useEffect, useState } from "react";
import { buildReportParams } from "../../../../core-dashboard/reports/utils/reportUtils";

/**
 * Client-D Reports data:
 * - /reports/summary
 * - /reports/top-services
 * - /reports/top-regions
 *
 * Output: reportData merged into one object for the view.
 */
export function useReportsData({ api, caps, filters }) {
  const [fetchingData, setFetchingData] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (!api || !caps) return;
    if (!caps.modules?.reports?.enabled) return;

    const fetchData = async () => {
      setFetchingData(true);

      try {
        const params = buildReportParams(filters);

        const canSummary = !!caps?.modules?.reports?.endpoints?.summary;
        const canTopServices = !!caps?.modules?.reports?.endpoints?.topServices;
        const canTopRegions = !!caps?.modules?.reports?.endpoints?.topRegions;

        const [summaryRes, servicesRes, regionsRes] = await Promise.all([
          canSummary ? api.call("reports", "summary", { params }) : Promise.resolve(null),
          canTopServices ? api.call("reports", "topServices", { params }) : Promise.resolve(null),
          canTopRegions ? api.call("reports", "topRegions", { params }) : Promise.resolve(null),
        ]);

        const summaryRaw = summaryRes?.data ?? summaryRes;
        const servicesRaw = servicesRes?.data ?? servicesRes;
        const regionsRaw = regionsRes?.data ?? regionsRes;

        const summary =
          summaryRaw?.success && summaryRaw?.data ? summaryRaw.data : summaryRaw?.data ?? summaryRaw ?? {};

        const topServicesFromEndpoint = Array.isArray(servicesRaw?.data)
          ? servicesRaw.data
          : Array.isArray(servicesRaw)
          ? servicesRaw
          : [];

        const topRegionsFromEndpoint = Array.isArray(regionsRaw?.data)
          ? regionsRaw.data
          : Array.isArray(regionsRaw)
          ? regionsRaw
          : [];

        const merged = {
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
      } catch (err) {
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
