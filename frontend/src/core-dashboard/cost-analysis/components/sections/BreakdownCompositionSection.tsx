import React, { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import type {
  BreakdownRow,
  SpendAnalyticsFilterPatch,
  SpendAnalyticsFilters,
  SpendAnalyticsPayload,
} from "../../types";
import { formatCurrency } from "../../utils/format";
import { buildSeriesColorMap } from "../../utils/seriesColors";
import { formatSignedPercent } from "../../utils/view.helpers";

type BreakdownTabKey =
  | "byService"
  | "byProvider"
  | "byRegion"
  | "byAccount"
  | "byTeam"
  | "byApp"
  | "byEnv"
  | "byCostCategory";

const tabs: Array<{ key: BreakdownTabKey; label: string }> = [
  { key: "byService", label: "Service" },
  { key: "byProvider", label: "Provider" },
  { key: "byRegion", label: "Region" },
  { key: "byAccount", label: "Account" },
  { key: "byTeam", label: "Team" },
  { key: "byApp", label: "App" },
  { key: "byEnv", label: "Environment" },
  { key: "byCostCategory", label: "Cost Category" },
];

interface BreakdownCompositionSectionProps {
  breakdown: SpendAnalyticsPayload["breakdown"];
  filters: SpendAnalyticsFilters;
  onFiltersChange: (patch: SpendAnalyticsFilterPatch) => void;
  serviceKeys?: string[];
}

const filterMap: Record<BreakdownTabKey, keyof SpendAnalyticsFilters> = {
  byProvider: "provider",
  byService: "service",
  byRegion: "region",
  byAccount: "account",
  byTeam: "team",
  byApp: "app",
  byEnv: "env",
  byCostCategory: "costCategory",
};
const VISIBLE_ROWS = 4;
const ESTIMATED_ROW_HEIGHT_PX = 122;
const ROW_GAP_PX = 8;

const BreakdownCompositionSection = ({
  breakdown,
  filters,
  onFiltersChange,
  serviceKeys = [],
}: BreakdownCompositionSectionProps) => {
  const [tab, setTab] = useState<BreakdownTabKey>("byService");
  const serviceColorMap = useMemo(
    () => buildSeriesColorMap(serviceKeys.filter((key) => key && key !== "Other")),
    [serviceKeys]
  );

  const rows = useMemo<BreakdownRow[]>(
    () => (Array.isArray(breakdown[tab]) ? (breakdown[tab] as BreakdownRow[]) : []),
    [breakdown, tab]
  );
  const listViewportHeight = VISIBLE_ROWS * ESTIMATED_ROW_HEIGHT_PX + (VISIBLE_ROWS - 1) * ROW_GAP_PX;
  const shouldScroll = rows.length > VISIBLE_ROWS;
  const activeFilterField = filterMap[tab];
  const activeFilterValue = String(filters[activeFilterField] || "All");

  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-emerald-700" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Breakdown & Composition</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
          Top 5 + Others
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Active filter: <span className="text-slate-700">{activeFilterValue}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setTab("byService");
            onFiltersChange({
              provider: "All",
              service: "All",
              region: "All",
              account: "All",
              subAccount: "All",
              team: "All",
              app: "All",
              env: "All",
              costCategory: "All",
              tagKey: "",
              tagValue: "",
            });
          }}
          className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
        >
          Reset
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
              tab === item.key
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        className={`min-h-0 pr-1 ${shouldScroll ? "overflow-y-auto" : "overflow-y-hidden"}`}
        style={{ maxHeight: `${listViewportHeight}px` }}
      >
        <div className="space-y-2">
        {rows.map((row) => (
            <button
              key={row.name}
              type="button"
              onClick={() => {
                if (row.isOthers) return;
                onFiltersChange({
                  provider: activeFilterField === "provider" ? row.name : "All",
                  service: activeFilterField === "service" ? row.name : "All",
                  region: activeFilterField === "region" ? row.name : "All",
                  account: activeFilterField === "account" ? row.name : "All",
                  team: activeFilterField === "team" ? row.name : "All",
                  app: activeFilterField === "app" ? row.name : "All",
                  env: activeFilterField === "env" ? row.name : "All",
                  costCategory: activeFilterField === "costCategory" ? row.name : "All",
                });
              }}
              className={`w-full rounded-xl border p-3 text-left transition ${
                !row.isOthers && activeFilterValue === row.name
                  ? "border-emerald-300 bg-emerald-50/40"
                  : "border-slate-100 bg-white hover:border-emerald-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {tab === "byService" && !row.isOthers ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: serviceColorMap[row.name] || "#64748b" }}
                        />
                        <span>{row.name}</span>
                      </span>
                    ) : (
                      row.name
                    )}
                    {row.isOthers && row.memberCount ? ` (${row.memberCount})` : ""}
                  </p>
                  <p className="text-[11px] text-slate-500">{row.compareLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{formatCurrency(row.spend)}</p>
                  <p className="text-[11px] font-semibold text-slate-500">{row.sharePercent.toFixed(2)}% share</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold ${
                    row.deltaValue >= 0 ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {formatSignedPercent(row.deltaPercent)} ({formatCurrency(row.deltaValue)})
                </span>
                <div className="h-1.5 w-28 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(2, Math.min(100, row.sharePercent))}%` }}
                  />
                </div>
              </div>
            </button>
        ))}
        </div>
      </div>
    </section>
  );
};

export default BreakdownCompositionSection;
