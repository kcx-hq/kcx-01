import React from "react";
import { FileText } from "lucide-react";
import PremiumGate from "../common/PremiumGate";

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
    <>
      <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={24} className="text-[#a02ff1]" />
            {title}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>

        {/* Reports Grid */}
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
    </>
  );
};

export default ReportsView;
