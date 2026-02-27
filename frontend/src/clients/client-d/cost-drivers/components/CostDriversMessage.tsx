import React from "react";
import { AlertTriangle } from "lucide-react";
import type { CostDriversMessageProps } from "../types";

export function CostDriversMessage({ message }: CostDriversMessageProps) {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-start gap-3">
      <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
      <div className="flex-1">
        <p className="text-yellow-400 font-medium text-sm">{message}</p>
        {String(message).includes("No billing data") && (
          <p className="text-yellow-300/70 text-xs mt-2">
            Go to the Upload page to add your billing files.
          </p>
        )}
      </div>
    </div>
  );
}
