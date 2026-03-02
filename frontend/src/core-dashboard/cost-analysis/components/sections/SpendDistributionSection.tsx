import React, { useMemo, useState } from "react";
import { BarChart3, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import KpiInsightModal from "../../../common/components/KpiInsightModal";
import type { SpendAnalyticsPayload } from "../../types";
import { formatCurrency } from "../../utils/format";
import { formatSignedPercent } from "../../utils/view.helpers";

interface SpendDistributionSectionProps {
  spendDistribution: SpendAnalyticsPayload["spendDistribution"];
  controls: SpendAnalyticsPayload["controls"];
}

type DistributionKpiKey = "total" | "service" | "region" | "top3";

const bandClass = (band: string): string => {
  if (band === "critical") return "border-rose-200 bg-rose-50 text-rose-700";
  if (band === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

const dimensionLabel = (value: string): string => {
  const v = String(value || "").toLowerCase();
  if (v === "service") return "Service";
  if (v === "region") return "Region";
  if (v === "provider") return "Provider";
  if (v === "account") return "Account";
  return value;
};

const formatDuration = (startDate?: string | null, endDate?: string | null): string => {
  if (!startDate || !endDate) return "Selected period";
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Selected period";
  const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
  return `${startDate} to ${endDate} (${days} days)`;
};

const SpendDistributionSection = ({ spendDistribution, controls }: SpendDistributionSectionProps) => {
  const navigate = useNavigate();
  const [activeKpi, setActiveKpi] = useState<DistributionKpiKey | null>(null);
  const strip = spendDistribution?.kpiStrip || {
    totalScopedSpend: 0,
    topServiceSharePct: 0,
    topRegionSharePct: 0,
    top3SharePct: 0,
    concentrationBand: "on_track",
  };
  const compareRows = Array.isArray(spendDistribution?.compareRows)
    ? spendDistribution.compareRows
    : [];
  const compareLabel = String(spendDistribution?.compareLabel || "Previous period");
  const durationLabel = formatDuration(controls?.startDate, controls?.endDate);
  const topServiceName =
    compareRows.find((row) => String(row.dimension).toLowerCase() === "service")?.name || "N/A";
  const topRegionName =
    compareRows.find((row) => String(row.dimension).toLowerCase() === "region")?.name || "N/A";
  const topServiceRow = useMemo(
    () =>
      compareRows
        .filter((row) => String(row.dimension).toLowerCase() === "service")
        .sort((a, b) => Number(b.sharePercent || 0) - Number(a.sharePercent || 0))[0] || null,
    [compareRows]
  );
  const topRegionRow = useMemo(
    () =>
      compareRows
        .filter((row) => String(row.dimension).toLowerCase() === "region")
        .sort((a, b) => Number(b.sharePercent || 0) - Number(a.sharePercent || 0))[0] || null,
    [compareRows]
  );
  const top3Services = useMemo(
    () =>
      compareRows
        .filter((row) => String(row.dimension).toLowerCase() === "service")
        .sort((a, b) => Number(b.sharePercent || 0) - Number(a.sharePercent || 0))
        .slice(0, 3),
    [compareRows]
  );
  const top3CurrentCost = useMemo(() => {
    const summed = top3Services.reduce((sum, row) => sum + Number(row.currentSpend || 0), 0);
    if (summed > 0) return summed;
    return (Number(strip.totalScopedSpend || 0) * Number(strip.top3SharePct || 0)) / 100;
  }, [strip.top3SharePct, strip.totalScopedSpend, top3Services]);
  const top3PreviousCost = useMemo(
    () => top3Services.reduce((sum, row) => sum + Number(row.previousSpend || 0), 0),
    [top3Services]
  );
  const top3DeltaValue = top3CurrentCost - top3PreviousCost;
  const top3DeltaPercent = top3PreviousCost > 0 ? (top3DeltaValue / top3PreviousCost) * 100 : 0;
  const top3InsightPoints = useMemo(
    () => [
      `Duration: ${durationLabel}`,
      `Top 3 combined cost: ${formatCurrency(top3CurrentCost)}`,
      `Previous period: ${formatCurrency(top3PreviousCost)} (${compareLabel})`,
      `Delta: ${formatCurrency(top3DeltaValue)} (${formatSignedPercent(top3DeltaPercent)})`,
      ...top3Services.map(
        (row, index) =>
          `#${index + 1} ${row.name}: ${formatCurrency(Number(row.currentSpend || 0))} (${Number(
            row.sharePercent || 0
          ).toFixed(2)}%)`
      ),
    ],
    [
      compareLabel,
      durationLabel,
      top3CurrentCost,
      top3DeltaPercent,
      top3DeltaValue,
      top3PreviousCost,
      top3Services,
    ]
  );

  const cards = useMemo(
    () => [
      {
        key: "total" as DistributionKpiKey,
        title: "Total Scoped Spend",
        value: formatCurrency(strip.totalScopedSpend),
        insight: `Duration: ${durationLabel}`,
      },
      {
        key: "service" as DistributionKpiKey,
        title: "Top Service Share",
        value: `${Number(strip.topServiceSharePct || 0).toFixed(2)}%`,
        insight: `Service: ${topServiceName}`,
      },
      {
        key: "region" as DistributionKpiKey,
        title: "Top Region Share",
        value: `${Number(strip.topRegionSharePct || 0).toFixed(2)}%`,
        insight: `Region: ${topRegionName}`,
      },
      {
        key: "top3" as DistributionKpiKey,
        title: "Top 3 Share",
        value: `${Number(strip.top3SharePct || 0).toFixed(2)}%`,
        insight: `Top 3 cost: ${formatCurrency(top3CurrentCost)}`,
      },
    ],
    [durationLabel, strip, top3CurrentCost, topRegionName, topServiceName]
  );
  const activeKpiDetails = useMemo(() => {
    if (!activeKpi) return null;
    if (activeKpi === "total") {
      return {
        title: "Total Scoped Spend Insight",
        value: formatCurrency(strip.totalScopedSpend),
        summary: "Spend covered by current filter scope and selected period.",
        points: [
          `Duration: ${durationLabel}`,
          `Compare mode: ${compareLabel}`,
          `Total compare rows: ${compareRows.length}`,
          `Concentration band: ${String(strip.concentrationBand || "on_track").replace(/_/g, " ")}`,
        ],
      };
    }
    if (activeKpi === "service") {
      return {
        title: "Top Service Share Insight",
        value: `${Number(strip.topServiceSharePct || 0).toFixed(2)}%`,
        summary: "Highest service concentration in the current scope.",
        points: [
          `Top service: ${topServiceName}`,
          `Current spend: ${formatCurrency(Number(topServiceRow?.currentSpend || 0))}`,
          `Previous spend: ${formatCurrency(Number(topServiceRow?.previousSpend || 0))}`,
          `Delta: ${formatCurrency(Number(topServiceRow?.deltaValue || 0))} (${formatSignedPercent(
            Number(topServiceRow?.deltaPercent || 0)
          )})`,
        ],
      };
    }
    if (activeKpi === "region") {
      return {
        title: "Top Region Share Insight",
        value: `${Number(strip.topRegionSharePct || 0).toFixed(2)}%`,
        summary: "Highest regional concentration in the current scope.",
        points: [
          `Top region: ${topRegionName}`,
          `Current spend: ${formatCurrency(Number(topRegionRow?.currentSpend || 0))}`,
          `Previous spend: ${formatCurrency(Number(topRegionRow?.previousSpend || 0))}`,
          `Delta: ${formatCurrency(Number(topRegionRow?.deltaValue || 0))} (${formatSignedPercent(
            Number(topRegionRow?.deltaPercent || 0)
          )})`,
        ],
      };
    }
    return {
      title: "Top 3 Share Insight",
      value: `${Number(strip.top3SharePct || 0).toFixed(2)}% (${formatCurrency(top3CurrentCost)})`,
      summary: "Top 3 service concentration with cost impact for the selected scope.",
      points: top3InsightPoints,
    };
  }, [
    activeKpi,
    compareLabel,
    compareRows.length,
    durationLabel,
    strip.concentrationBand,
    strip.topRegionSharePct,
    strip.topServiceSharePct,
    strip.top3SharePct,
    strip.totalScopedSpend,
    top3CurrentCost,
    top3InsightPoints,
    topRegionName,
    topRegionRow?.currentSpend,
    topRegionRow?.deltaPercent,
    topRegionRow?.deltaValue,
    topRegionRow?.previousSpend,
    topServiceName,
    topServiceRow?.currentSpend,
    topServiceRow?.deltaPercent,
    topServiceRow?.deltaValue,
    topServiceRow?.previousSpend,
  ]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-emerald-700" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">
            Spend Distribution & Compare
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Compare: {compareLabel}
          </span>
          <span
            className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${bandClass(
              String(strip.concentrationBand || "on_track")
            )}`}
          >
            Concentration {String(strip.concentrationBand || "on_track").replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setActiveKpi((prev) => (prev === card.key ? null : card.key))}
            className={`rounded-2xl border p-4 text-left transition ${
              activeKpi === card.key
                ? "border-emerald-300 bg-emerald-50/40"
                : "border-slate-100 bg-slate-50/60 hover:border-emerald-200 hover:bg-emerald-50/40"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.title}</p>
            <p className="mt-1 text-xl font-black text-slate-900">{card.value}</p>
            <p className="mt-2 text-[11px] font-semibold text-slate-600">{card.insight}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Click for insight
            </p>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <div className="max-h-[420px] overflow-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3 py-2">Dimension</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2 text-right">Current</th>
                <th className="px-3 py-2 text-right">Previous</th>
                <th className="px-3 py-2 text-right">Delta</th>
                <th className="px-3 py-2 text-right">Delta %</th>
                <th className="px-3 py-2 text-right">Share %</th>
                <th className="px-3 py-2 text-right">Drill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {compareRows.length ? (
                compareRows.map((row, idx) => {
                  const deltaValue = Number(row.deltaValue || 0);
                  return (
                    <tr key={`${row.dimension}-${row.name}-${idx}`}>
                      <td className="px-3 py-2 font-semibold text-slate-700">
                        {dimensionLabel(String(row.dimension))}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-900">{row.name}</td>
                      <td className="px-3 py-2 text-right font-black text-slate-900">
                        {formatCurrency(Number(row.currentSpend || 0))}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {formatCurrency(Number(row.previousSpend || 0))}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-bold ${
                          deltaValue >= 0 ? "text-rose-700" : "text-emerald-700"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {deltaValue >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {formatCurrency(deltaValue)}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-bold ${
                          deltaValue >= 0 ? "text-rose-700" : "text-emerald-700"
                        }`}
                      >
                        {formatSignedPercent(Number(row.deltaPercent || 0))}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">
                        {Number(row.sharePercent || 0).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                            onClick={() => navigate(row.drillLinks?.costDrivers || "/dashboard/cost-drivers")}
                          >
                            Drivers
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                            onClick={() => navigate(row.drillLinks?.optimization || "/dashboard/optimization")}
                          >
                            Action <ArrowUpRight size={10} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">
                    No compare rows available for current scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <KpiInsightModal
        open={Boolean(activeKpi && activeKpiDetails)}
        title={activeKpiDetails?.title || "Spend Distribution Insight"}
        value={activeKpiDetails?.value || null}
        summary={activeKpiDetails?.summary || null}
        contextLabel={durationLabel}
        points={activeKpiDetails?.points || []}
        badgeText={String(strip.concentrationBand || "on_track").replace(/_/g, " ")}
        onClose={() => setActiveKpi(null)}
        maxWidthClass="max-w-lg"
      />
    </section>
  );
};

export default SpendDistributionSection;
