import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";

interface SectionLoadingProps {
  label?: string;
}

interface SectionRefreshOverlayProps {
  label?: string;
  rounded?: string;
}

interface SectionEmptyProps {
  message?: string;
}

interface SectionErrorProps {
  message?: string;
}

export const SectionLoading = ({ label = "Analyzing Section..." }: SectionLoadingProps) => (
  <div className="animate-in fade-in zoom-in-95 duration-300">
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[var(--border-light)] bg-white p-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <Loader2 className="mb-4 animate-spin text-[var(--brand-primary)]" size={28} />
        <h3 className="text-base font-bold text-[var(--text-primary)] md:text-lg">{label}</h3>
      </div>
    </div>
  </div>
);

export const SectionRefreshOverlay = ({ label = "Updating...", rounded = "rounded-2xl" }: SectionRefreshOverlayProps) => (
  <div className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px] ${rounded}`}>
    <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--brand-primary)] shadow-sm">
      <Loader2 size={14} className="animate-spin" />
      {label}
    </div>
  </div>
);

export const SectionEmpty = ({ message = "No data available" }: SectionEmptyProps) => (
  <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-light)] bg-white p-8 text-center text-[var(--text-muted)]">
    {message}
  </div>
);

export const SectionError = ({ message = "Something went wrong" }: SectionErrorProps) => (
  <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-white p-8 text-center">
    <AlertCircle className="text-rose-600" size={24} />
    <p className="text-sm font-medium text-rose-700">{message}</p>
  </div>
);

export default SectionLoading;



