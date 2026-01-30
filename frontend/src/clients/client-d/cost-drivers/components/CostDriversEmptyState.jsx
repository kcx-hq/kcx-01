import React from "react";
import { TrendingUp } from "lucide-react";

export function CostDriversEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-[#1a1b20] border border-white/10 rounded-2xl">
      <TrendingUp className="text-gray-500 mb-4" size={48} />
      <p className="text-gray-400 text-lg font-medium mb-2">
        No Cost Changes Detected
      </p>
      <p className="text-gray-500 text-sm text-center max-w-md">
        Try adjusting the time period, filters, or minimum change threshold to see cost drivers.
      </p>
    </div>
  );
}
