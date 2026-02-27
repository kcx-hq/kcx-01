import React from "react";
import { AlertTriangle } from "lucide-react";
import type { ErrorStateProps } from "../types";

export function ErrorState({ error }: ErrorStateProps) {
  const isAuthError =
    !!error &&
    (error.includes("Unauthorized") ||
      error.includes("token") ||
      error.includes("log in") ||
      error.includes("expired"));

  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-white p-10 text-center text-[var(--text-muted)]">
      <AlertTriangle size={48} className="mx-auto mb-4 text-rose-600" />
      <p className="mb-2 text-[var(--text-primary)]">{error || "No account data available"}</p>

      {isAuthError ? (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-[var(--brand-primary)] transition-colors hover:bg-emerald-100"
        >
          Refresh Page
        </button>
      ) : (
        <p className="mt-2 text-xs text-[var(--text-muted)]">Upload billing data to view account ownership information</p>
      )}
    </div>
  );
}

export default ErrorState;
