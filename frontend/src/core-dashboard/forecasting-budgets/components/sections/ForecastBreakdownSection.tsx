import { useEffect, useMemo, useState } from "react";
import type {
  ForecastCompositionContributor,
  ForecastCompositionTab,
  ForecastingBudgetsPayload,
} from "../../types";
import { formatCurrency, toNumber } from "../../utils/format";
import { SectionPanel } from "../shared/ui";

interface ForecastBreakdownSectionProps {
  data: ForecastingBudgetsPayload;
  currency: string;
}

function buildFallbackTabs(data: ForecastingBudgetsPayload): ForecastCompositionTab[] {
  const rows = data.submodules?.budgetSetupOwnership?.rows || [];
  const tabs: Array<{ id: string; label: string; keyOf: (row: (typeof rows)[number]) => string }> = [
    {
      id: "team",
      label: "Team",
      keyOf: (row) => String(row.scope || "Unassigned").split("/")[0]?.trim() || "Unassigned",
    },
    { id: "owner", label: "Owner", keyOf: (row) => row.owner || "Unassigned" },
  ];

  return tabs
    .map((tab) => {
      const grouped = new Map<string, number>();
      rows.forEach((row) => {
        const key = tab.keyOf(row);
        grouped.set(key, toNumber(grouped.get(key)) + toNumber(row.forecast));
      });
      const total = [...grouped.values()].reduce((sum, val) => sum + toNumber(val), 0);
      const contributors: ForecastCompositionContributor[] = [...grouped.entries()]
        .map(([name, forecastContribution]) => ({ name, forecastContribution: toNumber(forecastContribution) }))
        .sort((a, b) => b.forecastContribution - a.forecastContribution)
        .slice(0, 5)
        .map((row, idx) => ({
          rank: idx + 1,
          name: row.name,
          currentCost: row.forecastContribution,
          previousCost: null,
          deltaValue: null,
          deltaPct: null,
          forecastDeltaContribution: null,
          forecastContribution: row.forecastContribution,
          sharePct: total > 0 ? (row.forecastContribution / total) * 100 : 0,
        }));
      return { id: tab.id, label: tab.label, contributors };
    })
    .filter((tab) => tab.contributors.length > 0);
}

export function ForecastBreakdownSection({ data, currency }: ForecastBreakdownSectionProps) {
  const tabs = useMemo(() => {
    const apiTabs = data.forecastView?.composition?.tabs || [];
    if (apiTabs.length) return apiTabs;
    return buildFallbackTabs(data);
  }, [data]);

  const [activeTab, setActiveTab] = useState("");
  useEffect(() => {
    if (!tabs.length) {
      setActiveTab("");
      return;
    }
    const hasActive = tabs.some((tab) => tab.id === activeTab);
    if (!hasActive) setActiveTab(tabs[0].id);
  }, [activeTab, tabs]);

  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const contributors = active?.contributors || [];
  const hasDeltaData = contributors.some((row) => row.deltaValue != null);
  const maxContribution = contributors.reduce(
    (max, row) =>
      Math.max(
        max,
        hasDeltaData ? Math.abs(toNumber(row.deltaValue)) : toNumber(row.forecastContribution)
      ),
    0
  );
  const driftValue = toNumber(data.forecastView?.kpi?.driftValue);
  const topIncrease = contributors
    .filter((row) => toNumber(row.deltaValue) > 0)
    .sort((a, b) => toNumber(b.deltaValue) - toNumber(a.deltaValue))[0];
  const topAbsoluteDriver = contributors
    .slice()
    .sort((a, b) => Math.abs(toNumber(b.deltaValue)) - Math.abs(toNumber(a.deltaValue)))[0];
  const summaryMessage = hasDeltaData
    ? `Forecast drift ${driftValue >= 0 ? "up" : "down"} by ${formatCurrency(
        Math.abs(driftValue),
        currency
      )}. ${topIncrease
        ? `Top increase from ${topIncrease.name}: ${formatCurrency(
            toNumber(topIncrease.deltaValue),
            currency
          )}.`
        : topAbsoluteDriver
        ? `Top driver is ${topAbsoluteDriver.name}: ${formatCurrency(
            toNumber(topAbsoluteDriver.deltaValue),
            currency
          )}.`
        : "No material drivers in this split."}`
    : "Only current-cost composition is available for this split.";

  return (
    <SectionPanel title="Forecast Breakdown">
      <div className="mb-3 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] ${
              tab.id === active?.id
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <p className="mb-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700">
        {summaryMessage}
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          {contributors.length ? (
            contributors.map((row) => {
              const barValue = hasDeltaData
                ? Math.abs(toNumber(row.deltaValue))
                : toNumber(row.forecastContribution);
              const width = maxContribution > 0 ? (barValue / maxContribution) * 100 : 0;
              const delta = toNumber(row.deltaValue);
              const isNeutral = hasDeltaData && Math.abs(delta) < 0.01;
              const isIncrease = delta > 0;
              return (
                <div key={`${active?.id}-${row.rank}-${row.name}`} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <p className="font-semibold text-slate-800">
                      #{row.rank} {row.name}
                    </p>
                    {hasDeltaData ? (
                      <p
                        className={`font-bold ${
                          isNeutral ? "text-slate-500" : isIncrease ? "text-rose-700" : "text-emerald-700"
                        }`}
                      >
                        {formatCurrency(toNumber(row.deltaValue), currency)} (
                        {row.deltaPct == null ? "N/A" : `${toNumber(row.deltaPct).toFixed(1)}%`})
                      </p>
                    ) : (
                      <p className="font-bold text-slate-700">
                        {formatCurrency(row.forecastContribution, currency)} ({row.sharePct.toFixed(1)}%)
                      </p>
                    )}
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className={`h-2 rounded-full ${
                        hasDeltaData
                          ? isNeutral
                            ? "bg-slate-400"
                            : isIncrease
                            ? "bg-rose-500"
                            : "bg-emerald-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${barValue > 0 ? Math.max(8, width) : 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Current {formatCurrency(row.currentCost, currency)} | Forecast impact{" "}
                    {row.forecastDeltaContribution == null
                      ? "N/A"
                      : formatCurrency(row.forecastDeltaContribution, currency)}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-600">No contributor data available.</p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="max-h-[340px] overflow-x-auto overflow-y-auto">
            <table className="min-w-[980px] divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-2 py-1.5">Rank</th>
                  <th className="px-2 py-1.5">Contributor</th>
                  <th className="px-2 py-1.5 text-right">Previous</th>
                  <th className="px-2 py-1.5 text-right">Current</th>
                  <th className="px-2 py-1.5 text-right">Delta</th>
                  <th className="px-2 py-1.5 text-right">Delta %</th>
                  <th className="px-2 py-1.5 text-right">Forecast Impact</th>
                  <th className="px-2 py-1.5 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {contributors.map((row) => (
                  <tr key={`${active?.id}-row-${row.rank}-${row.name}`}>
                    <td className="px-2 py-1.5 text-slate-700">{row.rank}</td>
                    <td className="px-2 py-1.5 font-semibold text-slate-900">{row.name}</td>
                    <td className="px-2 py-1.5 text-right text-slate-700">
                      {row.previousCost == null ? "N/A" : formatCurrency(row.previousCost, currency)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-slate-700">
                      {formatCurrency(row.currentCost, currency)}
                    </td>
                    <td
                      className={`px-2 py-1.5 text-right font-semibold ${
                        row.deltaValue == null
                          ? "text-slate-700"
                          : toNumber(row.deltaValue) >= 0
                          ? "text-rose-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {row.deltaValue == null ? "N/A" : formatCurrency(row.deltaValue, currency)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-slate-700">
                      {row.deltaPct == null ? "N/A" : `${toNumber(row.deltaPct).toFixed(2)}%`}
                    </td>
                    <td className="px-2 py-1.5 text-right text-slate-700">
                      {row.forecastDeltaContribution == null
                        ? "N/A"
                        : formatCurrency(row.forecastDeltaContribution, currency)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-slate-700">{row.sharePct.toFixed(2)}%</td>
                  </tr>
                ))}
                {!contributors.length ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-6 text-center text-sm text-slate-500">
                      No rows available.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SectionPanel>
  );
}
