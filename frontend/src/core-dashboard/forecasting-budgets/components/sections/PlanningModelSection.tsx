import { useEffect, useMemo, useState } from "react";
import type { ForecastingBudgetsPayload, ScenarioModel } from "../../types";
import { formatCurrency, formatPercent, formatSignedCurrency, toNumber } from "../../utils/format";
import { SectionPanel } from "../shared/ui";

interface PlanningModelSectionProps {
  data: ForecastingBudgetsPayload;
  currency: string;
  mode: "forecasting" | "budget";
}

const SCENARIO_PRIORITY = ["baseline", "growth", "cost_cut"];

export function PlanningModelSection({ data, currency, mode }: PlanningModelSectionProps) {
  const scenarios = useMemo(() => {
    const scenarioRows = data.submodules.scenarioPlanning.scenarios || [];
    const prioritized: ScenarioModel[] = [];

    SCENARIO_PRIORITY.forEach((id) => {
      const match = scenarioRows.find((row) => row.id === id);
      if (match) prioritized.push(match);
    });

    const overflow = scenarioRows.filter((row) => !SCENARIO_PRIORITY.includes(row.id));
    return [...prioritized, ...overflow].slice(0, 3);
  }, [data.submodules.scenarioPlanning.scenarios]);

  const derivedBudgetTarget = useMemo(() => {
    const totalBudget = data.submodules.budgetSetupOwnership.rows.reduce(
      (sum, row) => sum + toNumber(row.budget),
      0
    );
    if (totalBudget > 0) return totalBudget;
    return toNumber(data.kpiStrip.eomForecastAllocatedCost) * 1.05;
  }, [data.kpiStrip.eomForecastAllocatedCost, data.submodules.budgetSetupOwnership.rows]);

  const [budgetTarget, setBudgetTarget] = useState(derivedBudgetTarget);

  useEffect(() => {
    setBudgetTarget(derivedBudgetTarget);
  }, [derivedBudgetTarget]);

  const forecastAllocated = toNumber(data.kpiStrip.eomForecastAllocatedCost);
  const budgetDelta = forecastAllocated - budgetTarget;
  const burnPct = toNumber(data.kpiStrip.budgetConsumptionPct);
  const progressWidth = Math.max(0, Math.min(100, burnPct));
  const riskTone =
    budgetDelta > 0
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const monthOptions = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const [selectedMonth, setSelectedMonth] = useState(() => monthOptions[new Date().getMonth()] || "January");

  if (mode === "budget") {
    return (
      <SectionPanel title="Monthly Budget Setup (UI Prototype)">
        <p className="text-sm text-slate-700">
          Configure monthly budget targets. DB save and real alert triggers will be connected in backend phase.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Budget Month
            </span>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none ring-emerald-300 focus:ring-2"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Monthly Budget Target
            </span>
            <input
              type="number"
              min={0}
              step={100}
              value={Number.isFinite(budgetTarget) ? budgetTarget : 0}
              onChange={(event) => {
                const next = Number(event.target.value);
                setBudgetTarget(Number.isFinite(next) && next >= 0 ? next : 0);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none ring-emerald-300 focus:ring-2"
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={`rounded-xl border p-3 ${riskTone}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em]">{selectedMonth} Forecast Delta</p>
            <p className="mt-1 text-lg font-black">{formatSignedCurrency(budgetDelta, currency)}</p>
            <p className="mt-1 text-xs">
              Forecast: {formatCurrency(forecastAllocated, currency)} | Budget:{" "}
              {formatCurrency(budgetTarget, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Budget Burn Progress
            </p>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{selectedMonth} burn</span>
              <span>{formatPercent(burnPct)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${progressWidth}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Thresholds: warn {data.budgetStrategy.thresholds.warn}% | high{" "}
              {data.budgetStrategy.thresholds.high}% | breach {data.budgetStrategy.thresholds.breach}%
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled
          className="mt-3 inline-flex cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500"
        >
          Save Monthly Budget (Backend Coming Soon)
        </button>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title="Scenario Cards">
      <div className="space-y-3">
        {scenarios.length ? (
          scenarios.map((row) => (
            <article
              key={row.id}
              className={`rounded-xl border p-3 ${
                data.submodules.scenarioPlanning.recommendedScenario === row.id
                  ? "border-emerald-300 bg-emerald-50/60"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                {data.submodules.scenarioPlanning.recommendedScenario === row.id ? (
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                    Recommended
                  </span>
                ) : null}
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <p className="text-xs text-slate-700">
                  Forecast:{" "}
                  <span className="font-semibold">
                    {formatCurrency(row.outputs.forecastAllocatedCost, currency)}
                  </span>
                </p>
                <p className="text-xs text-slate-700">
                  Variance:{" "}
                  <span className="font-semibold">
                    {formatSignedCurrency(row.outputs.varianceVsBudget, currency)}
                  </span>
                </p>
                <p className="text-xs text-slate-700">
                  Breach risk:{" "}
                  <span className="font-semibold">{formatPercent(row.outputs.breachRiskPct)}</span>
                </p>
                <p className="text-xs text-slate-700">
                  Unit cost: <span className="font-semibold">{row.outputs.forecastUnitCost.toFixed(6)}</span>
                </p>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
            Scenario data is not available for this filter scope.
          </p>
        )}
      </div>
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
          Scenario Rule
        </p>
        <p className="mt-1 text-xs text-slate-700">
          Baseline, growth, and cost-cut scenarios guide planning outcomes and compare forecast risk.
        </p>
      </div>
    </SectionPanel>
  );
}

