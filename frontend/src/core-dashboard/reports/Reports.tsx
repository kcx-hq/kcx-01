import React, { useState, useCallback } from "react";
import { useAuthStore } from "../../store/Authstore";

import ReportsView from "./ReportsView";
import { useReportsData } from "./hooks/useReportsData";
import { useReportsDefinitions } from "./hooks/useReportsDefinitions";
import { parseCurrency, parsePercentage } from "./utils/parsers";
import type {
  ApiLikeError,
  DownloadReportPayload,
  ReportMetricItem,
  ReportsProps,
  ReportType,
} from "./types";

const Reports = ({ filters = {}, api, caps }: ReportsProps) => {
  const { user } = useAuthStore();

  const isLocked = !user?.is_premium;
  const canDownload = !!caps?.modules?.["reports"]?.endpoints?.["downloadPdf"];

  const [downloading, setDownloading] = useState(false);

  const { fetchingData, reportData, optimizationData } = useReportsData({
    api,
    caps,
    filters,
  });

  const reports = useReportsDefinitions(reportData , isLocked);

  const onDownloadReport = useCallback(
    async (reportType: ReportType) => {
      if (!api || !canDownload) return;

      setDownloading(true);

      try {
        const period = reportData?.billingPeriod || new Date().toISOString().split("T")[0] || "";
        const totalSpend = parseCurrency(reportData?.totalSpend || 0);

        const topServices = (reportData?.topServices || []).slice(0, 3).map((s: ReportMetricItem) => ({
          name: s?.name || "Unknown",
          cost: parseCurrency(s?.value ?? s?.cost ?? 0),
        }));

        const topRegions = (reportData?.topRegions || []).slice(0, 3).map((r: ReportMetricItem) => ({
          name: r?.name || "Unknown",
          cost: parseCurrency(r?.value ?? r?.cost ?? 0),
        }));

        const topServicePercent =
          topServices.length > 0 && totalSpend > 0 ? ((topServices[0]?.cost || 0) / totalSpend) * 100 : 0;

        const taggedPercent = parsePercentage(reportData?.taggedPercent || 0);
        const prodPercent = parsePercentage(reportData?.prodPercent || 0);

        const opt = optimizationData || {};
        const idleCount = opt?.idleResources?.length || 0;
        const rightSizingCount = opt?.rightSizingRecommendations?.length || 0;
        const totalRecommendations =
          idleCount + rightSizingCount + (opt?.underutilizedServices?.length || 0);

        const highConfidencePercent =
          totalRecommendations > 0 ? Math.round((idleCount / totalRecommendations) * 100) : 0;

        const underReviewPercent =
          totalRecommendations > 0 ? Math.round((rightSizingCount / totalRecommendations) * 100) : 0;

        const payload: DownloadReportPayload = {
          reportType,
          period,
          totalSpend,
          topServices,
          topRegions,
          optimizationData: {
            totalPotentialSavings: parseCurrency(opt?.totalPotentialSavings || 0),
            highConfidencePercent,
            underReviewPercent,
            idleResources: idleCount,
            rightSizing: rightSizingCount,
            commitments: 0,
          },
          topServicePercent,
          taggedPercent,
          prodPercent,
        };

        const res = await api.call("reports", "downloadPdf", {
          data: payload,
          responseType: "blob",
        });

        const blob = res instanceof Blob ? res : null;
        if (!(blob instanceof Blob)) throw new Error("Invalid PDF response");

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Cloud_Cost_Optimization_Report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err: unknown) {
        const error = err as ApiLikeError;
        console.error("PDF download failed:", error);
        alert("Failed to generate report PDF");
      } finally {
        setDownloading(false);
      }
    },
    [api, canDownload, reportData, optimizationData]
  );

  return (
    <ReportsView
      fetchingData={fetchingData}
      reports={reports}
      onDownloadReport={onDownloadReport}
      downloading={downloading}
      canDownload={canDownload}
    />
  );
};

export default Reports;



