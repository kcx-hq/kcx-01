import React from "react";
import { FileText } from "lucide-react";

import LoadingState from "./components/LoadingState";
import ReportCard from "./components/ReportCard";
import AboutExecutiveReportsNote from "./components/AboutExecutiveReportsNote";
import ComingSoonReports from "./components/ComingSoonReports";

const ReportsView = ({
  fetchingData,
  reports,
  onDownloadReport,
  downloading,
  canDownload,
  title = "Executive Reports",
  subtitle = "Downloadable PDF reports for leadership and stakeholders",
}) => {
  if (fetchingData) return <LoadingState />;

  return (
    <div className="core-shell animate-in fade-in zoom-in-95 duration-300">
      <div className="core-panel">
        <h1 className="flex items-center gap-2 text-xl font-black text-[var(--text-primary)] md:text-2xl">
          <FileText size={24} className="text-[var(--brand-primary)]" />
          {title}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
      </div>

      <div className="space-y-4">
        {reports.map((report, index) => (
          <ReportCard
            key={report.id}
            report={report}
            index={index}
            onDownload={onDownloadReport}
            downloading={downloading}
            canDownload={canDownload}
          />
        ))}
      </div>

      <AboutExecutiveReportsNote />
      <ComingSoonReports />
    </div>
  );
};

export default ReportsView;
