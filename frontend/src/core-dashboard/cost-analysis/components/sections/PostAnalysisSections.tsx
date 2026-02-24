import React, { useState } from "react";
import { AlertTriangle, CalendarClock, Link2 } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/format";
import { formatPercent } from "../../utils/view.helpers";
import MetricCard from "../shared/MetricCard";
import type { SpendAnomalyItem } from "../../types";

interface RiskRow {
  name: string;
  spend: number;
  spendShare: number;
  volatility: number;
  riskLevel: string;
}

interface ForecastState {
  projectedSpend: number;
  lowerBound: number;
  upperBound: number;
  confidence: string;
}

interface DrilldownPaths {
  varianceDrivers: string;
  resourceInventory: string;
  billingExplorer: string;
}

interface PostAnalysisSectionsProps {
  anomalyHighlights: SpendAnomalyItem[];
  predictabilityScore: number;
  volatilityScore: number;
  forecast: ForecastState | null | undefined;
  riskRows: RiskRow[];
  drilldownPaths: DrilldownPaths;
}

const PostAnalysisSections = ({
  anomalyHighlights,
  predictabilityScore,
  volatilityScore,
  forecast,
  riskRows,
  drilldownPaths,
}: PostAnalysisSectionsProps) => {
  const [riskLimit, setRiskLimit] = useState<"8" | "12" | "20" | "all">("8");
  const visibleRiskRows = riskLimit === "all" ? riskRows : riskRows.slice(0, Number(riskLimit));

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-600" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Anomaly Detection</h2>
        </div>
        {anomalyHighlights.length === 0 ? (
          <p className="text-sm text-slate-500">No anomalies detected for the selected scope.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            {anomalyHighlights.map((anomaly) => (
              <div key={anomaly.id} className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    {anomaly.confidence} confidence
                  </span>
                  <span className="text-xs font-bold text-slate-600">{formatDate(anomaly.detectedAt)}</span>
                </div>
                <p className="mt-2 text-lg font-black text-slate-900">{formatCurrency(anomaly.impact)}</p>
                <p className="text-xs font-semibold text-slate-600">
                  {anomaly.serviceHint} | {anomaly.regionHint} | {anomaly.accountHint}
                </p>
                <div className="mt-2 text-[11px] text-slate-600">
                  <p className="font-semibold">Likely drivers:</p>
                  <p>{anomaly.likelyDrivers.join(", ") || "Mixed drivers"}</p>
                </div>
                <a
                  href={anomaly.billingExplorerLink}
                  className="mt-3 inline-flex rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                >
                  Open Billing Explorer
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock size={16} className="text-emerald-700" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Predictability & Risk</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MetricCard label="Forecast Spend" value={formatCurrency(forecast?.projectedSpend ?? 0)} />
          <MetricCard label="Lower Bound" value={formatCurrency(forecast?.lowerBound ?? 0)} />
          <MetricCard label="Upper Bound" value={formatCurrency(forecast?.upperBound ?? 0)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Confidence: {forecast?.confidence || "Low"}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Predictability: {formatPercent(predictabilityScore)}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Volatility: {formatPercent(volatilityScore)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Risk Rows</p>
          <select
            value={riskLimit}
            onChange={(event) => setRiskLimit(event.target.value as "8" | "12" | "20" | "all")}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="8">Top 8</option>
            <option value="12">Top 12</option>
            <option value="20">Top 20</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="mt-2 overflow-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-2">Dimension</th>
                <th className="py-2">Spend</th>
                <th className="py-2">Share</th>
                <th className="py-2">Volatility</th>
                <th className="py-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {visibleRiskRows.map((risk) => (
                <tr key={risk.name} className="border-b border-slate-50 text-xs">
                  <td className="py-2 font-semibold text-slate-700">{risk.name}</td>
                  <td className="py-2 text-slate-700">{formatCurrency(risk.spend)}</td>
                  <td className="py-2 text-slate-700">{formatPercent(risk.spendShare)}</td>
                  <td className="py-2 text-slate-700">{formatPercent(risk.volatility)}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        risk.riskLevel === "High"
                          ? "bg-rose-100 text-rose-700"
                          : risk.riskLevel === "Medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {risk.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRiskRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-semibold text-slate-500">
              No risk rows available for selected scope.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Link2 size={16} className="text-emerald-700" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Drill-down Paths</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={drilldownPaths.varianceDrivers}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
          >
            Variance & Drivers
          </a>
          <a
            href={drilldownPaths.resourceInventory}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
          >
            Resource Inventory
          </a>
          <a
            href={drilldownPaths.billingExplorer}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
          >
            Billing Data Explorer
          </a>
        </div>
      </section>
    </>
  );
};

export default PostAnalysisSections;
