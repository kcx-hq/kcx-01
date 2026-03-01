import React from "react";
import { Clock, ShieldCheck } from "lucide-react";
import { confidenceClass, formatDateTime, formatPct, toSafeNumber } from "./formatters";

interface TrustFooterStripProps {
  lastDataRefreshAt: string | null | undefined;
  freshnessHours: number | null | undefined;
  providerCoveragePercent: number;
  costCoveragePercent: number;
  allocatedPercent: number;
  confidenceLevel: string;
}

const coverageToneClass = (value: number): string => {
  if (value >= 98) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value >= 95) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
};

const freshnessToneClass = (hours: number | null | undefined): string => {
  if (hours == null) return "border-slate-200 bg-slate-50 text-slate-700";
  if (hours <= 24) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (hours <= 48) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
};

const freshnessLabel = (hours: number | null | undefined): string => {
  if (hours == null) return "Unknown";
  if (hours <= 24) return "Fresh";
  if (hours <= 48) return "Stale";
  return "Delayed";
};

const trustSummaryByConfidence = (confidence = "Low"): string => {
  const normalized = String(confidence || "").toLowerCase();
  if (normalized === "high") return "Executive-ready data quality for decisions.";
  if (normalized === "medium") return "Use with attention to coverage watchpoints.";
  return "Validate key drivers before committing decisions.";
};

const TrustFooterStrip = ({
  lastDataRefreshAt,
  freshnessHours,
  providerCoveragePercent,
  costCoveragePercent,
  allocatedPercent,
  confidenceLevel,
}: TrustFooterStripProps) => {
  const provider = toSafeNumber(providerCoveragePercent);
  const cost = toSafeNumber(costCoveragePercent);
  const allocated = toSafeNumber(allocatedPercent);
  const freshness = freshnessHours == null ? null : toSafeNumber(freshnessHours);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[var(--brand-primary)]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
            Trust & Data Health
          </h3>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${confidenceClass(
            confidenceLevel
          )}`}
        >
          {confidenceLevel} confidence
        </span>
      </div>

      <p className="mb-3 text-xs text-slate-600">{trustSummaryByConfidence(confidenceLevel)}</p>

      <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 md:grid-cols-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-bold text-slate-700">Data freshness</p>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${freshnessToneClass(
                freshness
              )}`}
            >
              {freshnessLabel(freshness)}
            </span>
          </div>
          <p className="line-clamp-1">
            <Clock size={12} className="mr-1 inline" />
            {formatDateTime(lastDataRefreshAt)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {freshness == null ? "Freshness hours unavailable" : `${freshness.toFixed(1)}h since update`}
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-bold text-slate-700">Provider coverage</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${coverageToneClass(provider)}`}>
              {formatPct(provider)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-[var(--brand-primary)]" style={{ width: `${Math.min(100, provider)}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Cost rows mapped to known providers</p>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-bold text-slate-700">Cost coverage</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${coverageToneClass(cost)}`}>
              {formatPct(cost)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-[var(--brand-primary)]" style={{ width: `${Math.min(100, cost)}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Spend records with usable metadata</p>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-bold text-slate-700">Allocation coverage</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${coverageToneClass(allocated)}`}>
              {formatPct(allocated)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-[var(--brand-primary)]" style={{ width: `${Math.min(100, allocated)}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Spend attributed to owners/teams</p>
        </div>
      </div>
    </section>
  );
};

export default TrustFooterStrip;
