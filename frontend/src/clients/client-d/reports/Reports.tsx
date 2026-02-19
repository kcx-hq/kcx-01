import React, { useMemo } from "react";
import { useAuthStore } from "../../../store/Authstore";

import ReportsView from "./ReportsView";
import { useReportsData } from "./hooks/useReportsData";
import { useReportsDefinitions } from "./hooks/useReportsDefinitions";

const Reports = ({ filters = {}, api, caps }) => {
  const { user } = useAuthStore();
  const isLocked = !user?.is_premium;

  if (!api || !caps || !caps.modules?.reports?.enabled) return null;

  const { fetchingData, reportData } = useReportsData({ api, caps, filters });
  const reports = useReportsDefinitions(reportData, isLocked);

  // NOTE: your caps sample doesn't show downloadPdf; keep false safely
  const canDownload = !!caps?.modules?.reports?.endpoints?.downloadPdf;

  const summary = useMemo(() => reportData || {}, [reportData]);

  return (
    <ReportsView
      fetchingData={fetchingData}
      isLocked={isLocked}
      canDownload={canDownload}
      reports={reports}
      reportData={summary}
    />
  );
};

export default Reports;
