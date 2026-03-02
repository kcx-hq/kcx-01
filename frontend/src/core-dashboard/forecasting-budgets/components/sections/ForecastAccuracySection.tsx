import { Gauge, Target, TrendingUp } from "lucide-react";
import type { ForecastAccuracyMiss, ForecastingBudgetsPayload } from "../../types";
import { formatCurrency, formatPercent, formatSignedPercent, toNumber } from "../../utils/format";
import { SectionPanel } from "../shared/ui";

interface ForecastAccuracySectionProps {
  data: ForecastingBudgetsPayload;
  currency: string;
}

export function ForecastAccuracySection({ data, currency }: ForecastAccuracySectionProps) {
  const accuracy = data.forecastView?.accuracy;
  const tracking = data.submodules?.forecastActualTracking;

  const mape = accuracy?.mapePct ?? tracking?.mapePct ?? null;
  const wape = accuracy?.wapePct ?? tracking?.wapePct ?? null;
  const bias = accuracy?.biasPct ?? tracking?.biasPct ?? null;
  const misses: ForecastAccuracyMiss[] =
    (accuracy?.largestMissDays as ForecastAccuracyMiss[] | undefined) ||
    ((tracking?.topMisses || []) as ForecastAccuracyMiss[]);

  const biasLabel = bias == null ? "N/A" : bias > 2 ? "Over-forecasting" : bias < -2 ? "Under-forecasting" : "Balanced";
  const qualityTone =
    mape == null
      ? "text-slate-600 border-slate-200 bg-slate-50"
      : mape <= 20
      ? "text-emerald-700 border-emerald-200 bg-emerald-50"
      : mape <= 35
      ? "text-amber-700 border-amber-200 bg-amber-50"
      : "text-rose-700 border-rose-200 bg-rose-50";

  const missSeverity = (value: number) =>
    value >= 70 ? "high" : value >= 35 ? "medium" : "low";

  return (
    <SectionPanel title="Forecast Accuracy">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">
          Model quality overview for current scope.
        </p>
        <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${qualityTone}`}>
          {mape == null ? "insufficient data" : mape <= 20 ? "high quality" : mape <= 35 ? "watch" : "needs tuning"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">MAPE</p>
            <Target size={14} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-4xl font-black leading-none text-slate-900">{mape == null ? "N/A" : formatPercent(mape)}</p>
          <p className="mt-2 text-xs text-slate-600">Primary accuracy metric. Lower is better.</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">WAPE</p>
            <Gauge size={14} className="text-cyan-600" />
          </div>
          <p className="mt-2 text-4xl font-black leading-none text-slate-900">{wape == null ? "N/A" : formatPercent(wape)}</p>
          <p className="mt-2 text-xs text-slate-600">Weighted error across all days.</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Bias</p>
            <TrendingUp size={14} className="text-violet-600" />
          </div>
          <p className="mt-2 text-4xl font-black leading-none text-slate-900">{bias == null ? "N/A" : formatSignedPercent(bias)}</p>
          <p className="mt-2 text-xs text-slate-600">{biasLabel}</p>
        </article>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600">Largest Miss Days</p>
          <p className="text-xs text-slate-500">Top 5 by absolute miss</p>
        </div>

        <div className="max-h-[320px] overflow-x-auto overflow-y-auto">
          <table className="min-w-[860px] w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-2 py-1.5">Day</th>
                <th className="px-2 py-1.5 text-right">Actual</th>
                <th className="px-2 py-1.5 text-right">Forecast</th>
                <th className="px-2 py-1.5 text-right">Miss</th>
                <th className="px-2 py-1.5 text-right">Miss %</th>
                <th className="px-2 py-1.5 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {misses.slice(0, 5).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="px-2 py-1.5 font-semibold text-slate-900">{row.scope}</td>
                  <td className="px-2 py-1.5 text-right text-slate-700">{formatCurrency(row.actual, currency)}</td>
                  <td className="px-2 py-1.5 text-right text-slate-700">{formatCurrency(row.forecast, currency)}</td>
                  <td
                    className={`px-2 py-1.5 text-right font-semibold ${
                      toNumber(row.missValue) >= 0 ? "text-rose-700" : "text-emerald-700"
                    }`}
                  >
                    {formatCurrency(row.missValue, currency)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-semibold text-slate-700">
                    {toNumber(row.actual) < 1
                      ? "Low-base"
                      : toNumber(row.missPct) > 999
                      ? ">999%"
                      : formatPercent(row.missPct)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                        missSeverity(toNumber(row.missPct)) === "high"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : missSeverity(toNumber(row.missPct)) === "medium"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {missSeverity(toNumber(row.missPct))}
                    </span>
                  </td>
                </tr>
              ))}
              {!misses.length ? (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-center text-sm text-slate-500">
                    No miss-day data available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </SectionPanel>
  );
}
