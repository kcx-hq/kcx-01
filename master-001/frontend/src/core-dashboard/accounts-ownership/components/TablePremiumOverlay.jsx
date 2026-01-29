import React from "react";
import { Crown, Lock } from "lucide-react";

export function TablePremiumOverlay() {
  return (
    <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto">
      <div
        className="sticky top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
        style={{ width: "fit-content", height: "fit-content" }}
      >
        <div className="text-center p-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500/30 mb-4">
            <Crown size={32} className="text-yellow-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Premium Feature</h3>
          <p className="text-sm text-gray-400 mb-4 max-w-xs">This feature is available in our paid version</p>
          <button className="px-6 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto">
            <Lock size={16} />
            Upgrade to Access
          </button>
        </div>
      </div>
    </div>
  );
}
