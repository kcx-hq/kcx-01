import React from "react";
import { Loader2 } from "lucide-react";

const LoadingState = ({ label = "Loading report data..." }) => {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#a02ff1] mx-auto mb-4" size={32} />
          <p className="text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
