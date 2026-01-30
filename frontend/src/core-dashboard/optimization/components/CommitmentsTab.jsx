// apps/frontend/src/features/optimization/components/CommitmentsTab.jsx
import React from "react";
import { AlertCircle, Lightbulb } from "lucide-react";

export function CommitmentsTab() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-12 text-center max-w-md">
        <AlertCircle size={64} className="text-[#a02ff1] mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-white mb-3">Coming Soon</h3>
        <p className="text-gray-400 mb-6">
          Commitment analysis and Reserved Instance recommendations will be available soon.
          This feature will help you identify opportunities for Savings Plans and Reserved Instances.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Lightbulb size={16} />
          <span>Stay tuned for updates!</span>
        </div>
      </div>
    </div>
  );
}
