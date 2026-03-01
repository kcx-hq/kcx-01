import React, { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import type { SpendAnalyticsFilters, SpendAnalyticsPayload } from "../../types";
import { formatDate } from "../../utils/format";

interface TrustCueSectionProps {
  trust: SpendAnalyticsPayload["trust"];
  filters: SpendAnalyticsFilters;
}

const TrustCueSection = ({ trust, filters }: TrustCueSectionProps) => {
  const selectedSnapshot = useMemo(() => {
    const selectedControls: string[] = [
      `Range: ${String(filters.timeRange).toUpperCase()}`,
      `Granularity: ${String(filters.granularity)}`,
      `Compare: ${String(filters.compareTo).replace(/_/g, " ")}`,
    ];

    const filterPairs: Array<[string, string]> = [
      ["Provider", filters.provider],
      ["Service", filters.service],
      ["Region", filters.region],
      ["Account", filters.account],
      ["Sub Account", filters.subAccount],
      ["Team", filters.team],
      ["App", filters.app],
      ["Environment", filters.env],
      ["Cost Category", filters.costCategory],
    ];

    const active = filterPairs
      .filter(([, value]) => value && value !== "All")
      .map(([label, value]) => `${label}: ${value}`);

    if (filters.tagKey) {
      selectedControls.push(
        filters.tagValue
          ? `Tag: ${filters.tagKey}=${filters.tagValue}`
          : `Tag key: ${filters.tagKey}`
      );
    }

    return [...selectedControls, ...active];
  }, [
    filters.timeRange,
    filters.granularity,
    filters.compareTo,
    filters.provider,
    filters.service,
    filters.region,
    filters.account,
    filters.subAccount,
    filters.team,
    filters.app,
    filters.env,
    filters.costCategory,
    filters.tagKey,
    filters.tagValue,
  ]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-700" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Trust Cues</span>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
          Freshness: {trust.lastUpdatedAt ? formatDate(trust.lastUpdatedAt) : "N/A"}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
          Coverage: {trust.coveragePercent.toFixed(2)}%
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
          Confidence: {trust.confidence}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
          Rows: {trust.scopedRows.toLocaleString("en-US")}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected Scope</span>
        {selectedSnapshot.length ? (
          selectedSnapshot.map((item) => (
            <span
              key={item}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
            All scope
          </span>
        )}
      </div>
    </section>
  );
};

export default TrustCueSection;
