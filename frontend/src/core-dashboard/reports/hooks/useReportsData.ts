import { useEffect, useState } from "react";
import { buildReportParams } from "../utils/reportUtils";

export function useReportsData({ api, caps, filters }) {
  const [fetchingData, setFetchingData] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);

  useEffect(() => {
    if (!api || !caps) return;

    const fetchData = async () => {
      setFetchingData(true);
      try {
        const params = buildReportParams(filters);

        const canSummary = !!caps?.modules?.reports?.endpoints?.summary;
        const canOptimization = !!caps?.modules?.optimization?.endpoints?.recommendations;

        const [summaryRes, optimizationRes] = await Promise.all([
          canSummary ? api.call("reports", "summary", { params }) : Promise.resolve(null),
          canOptimization ? api.call("optimization", "recommendations", { params }) : Promise.resolve(null),
        ]);

        const summaryData = summaryRes?.data ?? summaryRes;
        const optData = optimizationRes?.data ?? optimizationRes;

        if (summaryData) setReportData(summaryData);
        if (optData) setOptimizationData(optData);
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, [api, caps, filters]);

  return { fetchingData, reportData, optimizationData };
}
