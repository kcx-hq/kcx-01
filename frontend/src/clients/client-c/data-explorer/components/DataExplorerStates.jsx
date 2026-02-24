import React from "react";
import { Loader2, AlertCircle } from "lucide-react";

const DataExplorerStates = ({ type }) => {
  if (type === "loading") {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-[#ffffff]/50">
        <Loader2 className="text-[#1EA88A] mb-2 animate-spin" size={32} />
        <p className="text-gray-400">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="h-[60vh] flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-[#ffffff]/50">
      <AlertCircle className="text-gray-500 mb-2" size={32} />
      <p className="text-gray-400">No data available to display</p>
    </div>
  );
};

export default DataExplorerStates;