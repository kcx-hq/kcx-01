import React from "react";
import { Loader2 } from "lucide-react";
import type { LoadingStateProps } from "../types";

export function LoadingState({ label = "Loading accounts data..." }: LoadingStateProps) {
  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-white p-10 text-center text-[var(--text-muted)]">
      <Loader2 size={48} className="mx-auto mb-4 animate-spin text-[var(--brand-primary)]" />
      <p>{label}</p>
    </div>
  );
}
