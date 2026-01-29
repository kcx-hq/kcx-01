import React from "react";
import { AlertTriangle } from "lucide-react";

export function ErrorState({ error }) {
  const isAuthError =
    !!error &&
    (error.includes("Unauthorized") ||
      error.includes("token") ||
      error.includes("log in") ||
      error.includes("expired"));

  return (
    <div className="p-10 text-gray-500 text-center">
      <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
      <p className="text-white mb-2">{error || "No account data available"}</p>

      {isAuthError ? (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#a02ff1] hover:bg-[#8e25d9] text-white rounded-lg text-sm font-medium transition-colors"
        >
          Refresh Page
        </button>
      ) : (
        <p className="text-xs text-gray-600 mt-2">Upload billing data to view account ownership information</p>
      )}
    </div>
  );
}
