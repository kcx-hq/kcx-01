import React, { useMemo, useState } from "react";
import { Building2, Lightbulb } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../../utils/format";
import { formatPercent, formatSignedPercent, getToneCardClass } from "../../utils/view.helpers";
import { PALETTE } from "../../utils/view.constants";
import type { BreakdownRow } from "../../types";
import type { BusinessInsightItem } from "./types";

interface BusinessProviderInsightsSectionProps {
  businessInsights: BusinessInsightItem[];
  selectedProvider: string;
  providerBreakdown: BreakdownRow[];
  regionBreakdown: BreakdownRow[];
  topServiceMix: BreakdownRow[];
  top5ServiceShare: number;
  topRegion?: BreakdownRow;
  onProviderSelect: (provider: string) => void;
}

const BusinessProviderInsightsSection = ({
  businessInsights,
  selectedProvider,
  providerBreakdown,
  regionBreakdown,
  topServiceMix,
  top5ServiceShare,
  topRegion,
  onProviderSelect,
}: BusinessProviderInsightsSectionProps) => {
  const [providerTopN, setProviderTopN] = useState<"5" | "10" | "20" | "all">("10");

  const visibleProviders = useMemo(() => {
    let rows = providerBreakdown.filter((row) => row.spend > 0);
    rows = [...rows].sort((a, b) => b.spend - a.spend);
    if (providerTopN === "all") return rows;
    return rows.slice(0, Number(providerTopN));
  }, [providerBreakdown, providerTopN]);

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-600" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Business Insights</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {businessInsights.map((insight) => (
            <div key={insight.label} className={`rounded-2xl border p-4 ${getToneCardClass(insight.tone)}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{insight.label}</p>
              <p className="mt-2 text-base font-black text-slate-900">{insight.headline}</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-emerald-700" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Provider Insights</h2>
          </div>
          {selectedProvider !== "All" ? (
            <button
              type="button"
              onClick={() => onProviderSelect("All")}
              className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Provider</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-700">
              {selectedProvider || "All"}
            </span>
          </div>
        </div>
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Top 5 Service Mix</p>
            <div className="h-32">
              {topServiceMix.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">
                  No service mix data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topServiceMix}
                      dataKey="spend"
                      nameKey="name"
                      innerRadius={24}
                      outerRadius={44}
                      paddingAngle={2}
                    >
                      {topServiceMix.map((item, index) => (
                        <Cell key={`service-pie-${item.name}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mb-2 space-y-1.5">
              {topServiceMix.map((service, index) => (
                <div key={`service-legend-${service.name}`} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                    />
                    <span className="truncate text-[10px] font-semibold text-slate-700">{service.name}</span>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-slate-600">
                    {formatPercent(service.sharePercent)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-semibold text-slate-600">
              Top 5 services contribute {formatPercent(top5ServiceShare)} of total spend.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Top Region Snapshot</p>
            <p className="mt-1 text-sm font-black text-slate-900">{topRegion?.name || "N/A"}</p>
            <p className="text-xs font-semibold text-slate-600">
              {formatPercent(topRegion?.sharePercent ?? 0)} share | {formatCurrency(topRegion?.spend ?? 0)}
            </p>
            <div className="mt-2 space-y-1.5">
              {regionBreakdown.slice(0, 5).map((region, index) => (
                <div key={`top-region-${region.name}`} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[10px] font-semibold text-slate-600">{region.name}</span>
                    <span className="text-[10px] font-bold text-slate-700">{formatPercent(region.sharePercent)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-200">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, region.sharePercent))}%`,
                        backgroundColor: PALETTE[index % PALETTE.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Visible Rows</span>
          <select
            value={providerTopN}
            onChange={(event) => setProviderTopN(event.target.value as "5" | "10" | "20" | "all")}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="20">Top 20</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="space-y-2">
          {visibleProviders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
              No provider insight data available.
            </div>
          ) : (
            visibleProviders.map((provider) => {
              const isActiveProvider = selectedProvider === provider.name;
              return (
                <button
                  type="button"
                  key={provider.name}
                  onClick={() => onProviderSelect(provider.name)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    isActiveProvider
                      ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                      : "border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-slate-700">{provider.name}</p>
                    <span className="text-sm font-black text-slate-900">{formatCurrency(provider.spend)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {formatPercent(provider.sharePercent)} share
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        provider.deltaValue >= 0 ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {formatSignedPercent(provider.deltaPercent)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500"
                      style={{ width: `${Math.max(0, Math.min(100, provider.sharePercent))}%` }}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default BusinessProviderInsightsSection;
