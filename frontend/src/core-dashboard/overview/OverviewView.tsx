import React from "react";
import { AlertTriangle, ArrowUpRight, Clock, Database, ShieldAlert, TrendingUp } from "lucide-react";
import FilterBar from "../common/widgets/FilterBar";
import { SectionLoading, SectionRefreshOverlay } from "../common/SectionStates";
import OverviewStates from "./components/OverviewStates";
import {
  OverviewAction,
  OverviewAnomaly,
  OverviewApiData,
  OverviewFilterOptions,
  OverviewFilterPatch,
  OverviewFilters,
  OverviewNormalizedData,
  OverviewRiskFlag,
  ProviderMixEntry,
  TopMoverDriver,
} from "./types";

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatPct = (value: number, digits = 1): string =>
  `${Number(value || 0).toFixed(digits)}%`;

const riskBadgeClass = (severity = "low"): string => {
  if (severity === "high") return "border-rose-200 bg-rose-50 text-rose-700";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

const actionStatusClass = (status = "New"): string => {
  if (status === "Done") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Verified") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  if (status === "In progress") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

interface OverviewViewProps {
  filters: OverviewFilters;
  filterOptions: OverviewFilterOptions;
  onFilterChange: (filters: OverviewFilterPatch) => void;
  onReset: () => void;
  loading: boolean;
  isFiltering: boolean;
  overviewData: OverviewApiData | null;
  extractedData: OverviewNormalizedData;
}

const OverviewView = ({
  filters,
  filterOptions,
  onFilterChange,
  onReset,
  loading,
  isFiltering,
  overviewData,
  extractedData,
}: OverviewViewProps) => {
  const executiveOverview = extractedData.executiveOverview;
  const kpis = executiveOverview.kpiHeader;
  const budgetBurn = executiveOverview.outcomeAndRisk.budgetBurn;
  const riskFlags = executiveOverview.outcomeAndRisk.riskFlags;
  const topMovers = executiveOverview.topMovers;
  const actionCenter = executiveOverview.actionCenter;
  const anomalySpotlight = executiveOverview.anomalySpotlight;
  const dataTrust = executiveOverview.dataTrust;

  if (overviewData?.message === "No upload selected. Please select a billing upload.") {
    return <OverviewStates type="noUpload" />;
  }

  if (loading && !overviewData) {
    return <SectionLoading label="Analyzing Overview..." />;
  }

  return (
    <div className="core-shell flex h-full flex-col animate-in fade-in duration-500">
      <div className="sticky top-0 z-30 -mx-2 mb-4 bg-[var(--bg-main)]/95 px-2 py-2 backdrop-blur-sm">
        <FilterBar
          filters={filters}
          onChange={(next) => onFilterChange(next as Partial<typeof filters>)}
          onReset={onReset}
          providerOptions={filterOptions?.providers ?? []}
          serviceOptions={filterOptions?.services ?? []}
          regionOptions={filterOptions?.regions ?? []}
          compactMobile
          tight
        />
      </div>

      {overviewData && (
        <div className="relative flex-1 space-y-5 pb-12">
          {isFiltering && <SectionRefreshOverlay label="Refreshing executive overview..." />}

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {[
              {
                key: "mtdSpend",
                label: "MTD Spend",
                value: formatUSD(kpis.mtdSpend),
                delta: formatPct(kpis.mtdSpendDeltaPercent),
              },
              {
                key: "eomForecast",
                label: "EOM Forecast",
                value: formatUSD(kpis.eomForecast),
                delta: formatPct(kpis.mtdSpendDeltaPercent),
              },
              {
                key: "budgetVariance",
                label: "Budget Variance",
                value: formatUSD(kpis.budgetVarianceValue),
                delta: formatPct(kpis.budgetVariancePercent),
              },
              {
                key: "realizedSavings",
                label: "Realized Savings (MTD)",
                value: formatUSD(kpis.realizedSavingsMtd),
                delta: null,
              },
              {
                key: "pipelineSavings",
                label: "Pipeline Savings",
                value: formatUSD(kpis.pipelineSavings),
                delta: null,
              },
              {
                key: "unallocated",
                label: "Unallocated Spend",
                value: formatUSD(kpis.unallocatedSpendValue),
                delta: formatPct(kpis.unallocatedSpendPercent),
              },
            ].map((item: { key: string; label: string; value: string; delta: string | null }) => (
              <article
                key={item.key}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                <p className="mt-2 text-xl font-black text-slate-800">{item.value}</p>
                {item.delta && (
                  <p className="mt-1 text-xs font-semibold text-slate-500">Delta: {item.delta}</p>
                )}
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--brand-primary)]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                  Budget Burn Indicator
                </h3>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-slate-500">Status</p>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                    budgetBurn?.status === "Over budget"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : budgetBurn?.status === "Watch"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {budgetBurn?.status || "Watch"}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Budget Consumed</span>
                    <span className="font-semibold text-slate-700">
                      {formatPct(budgetBurn?.budgetConsumedPercent)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-rose-500"
                      style={{ width: `${Math.min(100, Number(budgetBurn?.budgetConsumedPercent || 0))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Month Elapsed</span>
                    <span className="font-semibold text-slate-700">
                      {formatPct(budgetBurn?.monthElapsedPercent)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-[var(--brand-primary)]"
                      style={{ width: `${Math.min(100, Number(budgetBurn?.monthElapsedPercent || 0))}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Burn variance to pace:{" "}
                <strong className="text-slate-700">
                  {formatPct(budgetBurn?.varianceToPacePercent)}
                </strong>
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert size={16} className="text-[var(--brand-primary)]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                  Outcome and Risk Flags
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {riskFlags.map((flag: OverviewRiskFlag) => (
                  <div
                    key={flag?.key}
                    className={`rounded-lg border px-3 py-2 ${riskBadgeClass(flag?.severity)}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold">{flag?.label}</p>
                      {flag?.active ? (
                        <span className="rounded bg-white/70 px-2 py-0.5 text-[10px] font-bold">Active</span>
                      ) : (
                        <span className="rounded bg-white/70 px-2 py-0.5 text-[10px] font-bold">Normal</span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-3 text-[11px]">
                      {flag?.count != null && <span>Count: {flag.count}</span>}
                      {flag?.impactValue > 0 && <span>Impact: {formatUSD(flag.impactValue)}</span>}
                      {flag?.metricPercent != null && <span>Metric: {formatPct(flag.metricPercent)}</span>}
                      {flag?.metricHours != null && <span>Freshness: {Number(flag.metricHours).toFixed(1)}h</span>}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                  Top Movers
                </h3>
                <a
                  href={topMovers?.driversLink || "/dashboard/cost-drivers"}
                  className="text-xs font-bold text-[var(--brand-primary)] hover:underline"
                >
                  Open Variance & Drivers
                </a>
              </div>

              <div className="space-y-2">
                {(topMovers?.drivers || []).length ? (
                  topMovers.drivers.map((driver: TopMoverDriver, idx: number) => (
                    <div key={`${driver?.name}-${idx}`} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="truncate text-sm font-semibold text-slate-700">{driver?.name}</p>
                      <p className={`text-xs font-bold ${driver?.direction === "increase" ? "text-rose-700" : "text-emerald-700"}`}>
                        {driver?.direction === "increase" ? "+" : "-"}
                        {formatUSD(Math.abs(Number(driver?.deltaValue || 0)))}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No movers detected for selected filters.</p>
                )}
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                  Provider Mix and Concentration
                </h3>
                <a
                  href={topMovers?.spendAnalyticsLink || "/dashboard/cost-analysis"}
                  className="text-xs font-bold text-[var(--brand-primary)] hover:underline"
                >
                  Open Spend Analytics
                </a>
              </div>

              <div className="space-y-3">
                {topMovers.providerMix.map((row: ProviderMixEntry, idx: number) => (
                  <div key={`${row?.provider}-${idx}`}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{row?.provider || "Unknown"}</span>
                      <span className="font-bold text-slate-600">{formatPct(row?.percent || 0)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-[var(--brand-primary)]"
                        style={{ width: `${Math.min(100, Number(row?.percent || 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Top Region Share</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {formatPct(topMovers?.concentration?.topRegion?.sharePercent || 0)}
                  </p>
                  <p className="text-xs text-slate-500">{topMovers?.concentration?.topRegion?.name || "N/A"}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Top Service Share</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {formatPct(topMovers?.concentration?.topService?.sharePercent || 0)}
                  </p>
                  <p className="text-xs text-slate-500">{topMovers?.concentration?.topService?.name || "N/A"}</p>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                Top Actions This Week
              </h3>
              <a
                href={actionCenter?.optimizationLink || "/dashboard/optimization"}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)] hover:underline"
              >
                Open in Optimization Hub <ArrowUpRight size={12} />
              </a>
            </div>

            {(actionCenter?.actions || []).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-2 py-2 font-bold uppercase tracking-wider">Action</th>
                      <th className="px-2 py-2 font-bold uppercase tracking-wider">Owner</th>
                      <th className="px-2 py-2 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-2 py-2 font-bold uppercase tracking-wider">Savings</th>
                      <th className="px-2 py-2 font-bold uppercase tracking-wider">Confidence</th>
                      <th className="px-2 py-2 font-bold uppercase tracking-wider">ETA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {actionCenter.actions.map((action: OverviewAction, idx: number) => (
                      <tr key={`${action?.id}-${idx}`}>
                        <td className="px-2 py-2 font-semibold text-slate-700">{action?.title}</td>
                        <td className="px-2 py-2 text-slate-600">{action?.owner || "Unassigned"}</td>
                        <td className="px-2 py-2">
                          <span className={`rounded border px-2 py-1 text-[10px] font-bold ${actionStatusClass(action?.status)}`}>
                            {action?.status || "New"}
                          </span>
                        </td>
                        <td className="px-2 py-2 font-bold text-emerald-700">
                          {formatUSD(action?.expectedSavings || 0)}
                        </td>
                        <td className="px-2 py-2 text-slate-600">{action?.confidence || "Medium"}</td>
                        <td className="px-2 py-2 text-slate-600">{action?.etaLabel || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No optimization actions available for selected filters.</p>
            )}
          </section>

          {(anomalySpotlight?.anomalies || []).length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-700">
                  <AlertTriangle size={14} className="text-rose-600" />
                  Anomaly Spotlight
                </h3>
                <a
                  href={anomalySpotlight?.spendAnalyticsLink || "/dashboard/cost-analysis"}
                  className="text-xs font-bold text-[var(--brand-primary)] hover:underline"
                >
                  Open anomaly view
                </a>
              </div>

              <div className="space-y-2">
                {anomalySpotlight.anomalies.map((anomaly: OverviewAnomaly, idx: number) => (
                  <div key={`${anomaly?.id}-${idx}`} className="rounded-lg border border-rose-100 bg-rose-50/40 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-700">{anomaly?.serviceName}</p>
                      <p className="text-xs font-bold text-rose-700">
                        Impact/day: {formatUSD(anomaly?.impactPerDay || 0)}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600">{anomaly?.suspectedCause}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      First detected: {anomaly?.firstDetectedDate || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-col gap-2 border-t border-slate-200/60 pt-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>
                Last Refresh:{" "}
                <strong className="text-slate-700">
                  {dataTrust?.lastDataRefreshAt
                    ? new Date(dataTrust.lastDataRefreshAt).toLocaleString("en-IN")
                    : "N/A"}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span>
                Owner Coverage:{" "}
                <strong className="text-slate-700">{formatPct(dataTrust?.ownerCoveragePercent || 0)}</strong>
              </span>
              <span>
                Tag Compliance:{" "}
                <strong className="text-slate-700">{dataTrust?.tagComplianceHeadline || "Unavailable"}</strong>
              </span>
              <a
                href={dataTrust?.governanceLink || "/dashboard/data-quality"}
                className="font-bold text-[var(--brand-primary)] hover:underline"
              >
                Governance & Data Health
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Database size={12} />
              <span>Source: Uploaded billing rows (USD) + optimization + governance models</span>
            </div>
          </div>
        </div>
      )}

      {!overviewData && !loading && !isFiltering && (
        <div className="flex min-h-[400px] flex-1 items-center justify-center">
          <OverviewStates type="empty" />
        </div>
      )}
    </div>
  );
};

export default OverviewView;



