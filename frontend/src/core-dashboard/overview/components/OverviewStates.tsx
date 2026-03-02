import { Loader2 } from "lucide-react";
import { OverviewStatusType } from "../types";

interface OverviewStatesProps {
  type: OverviewStatusType;
}

const OverviewStates = ({ type }: OverviewStatesProps) => {
  const accent = "var(--brand-secondary, #23a282)";

  if (type === "loading") {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
        <div className="bg-[#1a1b20]/80 backdrop-blur-xl border border-white/5 p-8 rounded-2xl text-center flex flex-col items-center justify-center min-h-[400px]">
          
          <Loader2
            className="animate-spin w-12 h-12 mb-6"
            style={{ color: accent }}
          />

          <div className="text-center">
            <p className="text-white font-semibold text-lg mb-2">
              Loading Overview Data
            </p>
            <p className="text-gray-400">
              Please wait while we fetch your dashboard information…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "noUpload") {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
        <div className="bg-[#1a1b20]/80 backdrop-blur-xl border border-white/5 p-8 rounded-xl text-center flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-gray-300 text-lg mb-2">No Data Available</p>
          <p className="text-gray-500 text-sm">
            Please select a billing upload to view overview data.
          </p>
        </div>
      </div>
    );
  }

  // default empty
  return (
    <div className="bg-[#1a1b20]/80 backdrop-blur-xl border border-white/5 p-8 rounded-xl text-center">
      <p className="text-gray-400">No overview data available</p>
    </div>
  );
};

export default OverviewStates;



