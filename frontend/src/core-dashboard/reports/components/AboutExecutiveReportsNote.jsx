import React from "react";
import { FileText } from "lucide-react";

const AboutExecutiveReportsNote = () => {
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <FileText size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-blue-400 mb-1">About Executive Reports</div>
          <div className="text-xs text-gray-300 space-y-1">
            <p>• Each report starts with a 1-page Executive Summary</p>
            <p>• Reports are generated as PDFs for easy sharing and presentation</p>
            <p>• All reports use clean typography and section headers for readability</p>
            <p>• Reports consolidate dashboard insights into executive-friendly formats</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutExecutiveReportsNote;
