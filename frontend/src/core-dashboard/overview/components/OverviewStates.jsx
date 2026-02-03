import { Loader2 } from "lucide-react";

const OverviewStates = ({ type }) => {
  if (type === "loading") {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
        <div className="bg-[#1a1b20]/80 backdrop-blur-xl border border-white/5 p-8 rounded-2xl text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative mb-6">
            <Loader2 className="animate-spin text-[#a02ff1] w-12 h-12" />
            <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-[#a02ff1] rounded-full animate-spin" style={{animationDuration: '0.8s'}}></div>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg mb-2">Loading Overview Data</p>
            <p className="text-gray-400">Please wait while we fetch your dashboard information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "noUpload") {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
        <div className="bg-[#1a1b20]/80 backdrop-blur-xl border border-white/5 p-8 rounded-xl text-center flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-gray-400 text-lg mb-2">No Data Available</p>
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
