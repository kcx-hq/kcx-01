import { Loader2 } from "lucide-react";

const DataQualityStates = ({ type }) => {
  if (type === "loading") {
    return (
      <div className="p-10 text-gray-500 text-center flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#a02ff1]" size={32} />
          <span>Analyzing Data Quality...</span>
        </div>
      </div>
    );
  }

  return <div className="p-10 text-gray-500 text-center">No data available</div>;
};

export default DataQualityStates;
