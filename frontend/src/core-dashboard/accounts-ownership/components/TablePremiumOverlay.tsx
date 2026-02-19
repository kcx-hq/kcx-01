import React from "react";
import { Crown, Lock } from "lucide-react";

export function TablePremiumOverlay() {
  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-white/75 backdrop-blur-sm">
      <div
        className="sticky left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        style={{ width: "fit-content", height: "fit-content" }}
      >
        <div className="p-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-100">
            <Crown size={32} className="text-amber-600" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">Premium Feature</h3>
          <p className="mb-4 max-w-xs text-sm text-[var(--text-muted)]">This feature is available in our paid version</p>
          <button className="mx-auto flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-100 px-6 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200">
            <Lock size={16} />
            Upgrade to Access
          </button>
        </div>
      </div>
    </div>
  );
}
