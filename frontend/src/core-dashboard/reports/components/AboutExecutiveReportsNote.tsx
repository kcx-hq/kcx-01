import React from "react";
import { FileText } from "lucide-react";

const AboutExecutiveReportsNote = () => {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <FileText size={20} className="mt-0.5 shrink-0 text-emerald-700" />
        <div>
          <div className="mb-1 text-sm font-semibold text-emerald-700">About Executive Reports</div>
          <div className="space-y-1 text-xs text-emerald-800/90">
            <p>- Each report starts with a one-page executive summary.</p>
            <p>- Reports are generated as PDFs for easy sharing and presentation.</p>
            <p>- All reports use clean section headers and readable typography.</p>
            <p>- Reports consolidate dashboard insights into leadership-ready formats.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutExecutiveReportsNote;
