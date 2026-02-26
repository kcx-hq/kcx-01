import React from "react";

interface KpiInsightModalProps {
  open: boolean;
  title: string;
  value?: string | null;
  summary?: string | null;
  points?: string[];
  contextLabel?: string | null;
  badgeText?: string | null;
  onClose: () => void;
  maxWidthClass?: string;
}

const KpiInsightModal = ({
  open,
  title,
  value,
  summary,
  points = [],
  contextLabel,
  badgeText,
  onClose,
  maxWidthClass = "max-w-md",
}: KpiInsightModalProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-white/65 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxWidthClass} rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{title}</p>
            {summary ? <p className="mt-2 text-sm font-semibold text-slate-700">{summary}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-emerald-200 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700 hover:bg-emerald-50"
          >
            Close
          </button>
        </div>

        {contextLabel ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Period</p>
            <p className="mt-1 text-xs font-semibold text-slate-700">{contextLabel}</p>
          </div>
        ) : null}

        {value ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Value</p>
              {badgeText ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  {badgeText}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
          </div>
        ) : null}

        {points.length ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Details</p>
            <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-700">
              {points.map((point) => (
                <li key={point}>- {point}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default KpiInsightModal;

