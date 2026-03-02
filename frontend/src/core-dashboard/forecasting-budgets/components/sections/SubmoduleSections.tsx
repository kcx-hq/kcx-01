import { useMemo, useState } from "react";
import type { AlertModel, BudgetRow, ForecastingBudgetsPayload } from "../../types";
import KpiInsightModal from "../../../common/components/KpiInsightModal";
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
  formatSignedPercent,
  toNumber,
} from "../../utils/format";
import { Metric, SectionPanel } from "../shared/ui";

interface SubmoduleSectionsProps {
  data: ForecastingBudgetsPayload;
  currency: string;
  mode: "forecasting" | "budget";
}

type BudgetKpiKey =
  | "planned_budget"
  | "consumed"
  | "variance_to_date"
  | "expected_by_now"
  | "pace_gap"
  | "remaining_budget"
  | "at_risk_owners";

export function SubmoduleSections({ data, currency, mode }: SubmoduleSectionsProps) {
  const [activeBudgetKpi, setActiveBudgetKpi] = useState<BudgetKpiKey | null>(null);
  const modules = data.submodules;
  const budgetRows = modules.budgetSetupOwnership.rows || [];
  const alertRows = modules.alertsEscalation.alerts || [];
  const trackingRows = modules.forecastActualTracking.byScope || [];

  const totalBudget = budgetRows.reduce((sum, row) => sum + toNumber(row.budget), 0);
  const totalConsumed = budgetRows.reduce((sum, row) => sum + toNumber(row.consumed), 0);
  const totalVarianceToDate = totalConsumed - totalBudget;
  const atRiskCount = budgetRows.filter(
    (row) => row.status === "at_risk" || row.status === "breached"
  ).length;
  const burnPct = totalBudget > 0 ? (totalConsumed / totalBudget) * 100 : 0;
  const expectedSpendToDate = budgetRows.reduce(
    (sum, row) => sum + (toNumber(row.budget) * toNumber(row.timeElapsedPct)) / 100,
    0
  );
  const spendVsExpected = totalConsumed - expectedSpendToDate;
  const burnVsPlanPct = toNumber(modules.budgetBurnControls.burnVsPlanPct);
  const daysRemaining = toNumber(modules.budgetBurnControls.daysRemaining);
  const remainingBudget = Math.max(0, totalBudget - totalConsumed);
  const spendVsExpectedAbs = Math.abs(spendVsExpected);
  const spendVsExpectedLabel =
    spendVsExpected > 0 ? "over" : spendVsExpected < 0 ? "under" : "on plan";
  const alignmentHeadline =
    burnVsPlanPct > 3
      ? "Budget burn is running ahead of plan."
      : burnVsPlanPct < -3
        ? "Budget burn is below planned pace."
        : "Budget burn is aligned with plan.";
  const alignmentDetail =
    burnVsPlanPct > 3
      ? `Current spend is ${formatCurrency(spendVsExpectedAbs, currency)} over expected pace. Tighten burn for the remaining ${daysRemaining} day(s).`
      : burnVsPlanPct < -3
        ? `Current burn is under plan with ${formatCurrency(remainingBudget, currency)} budget headroom remaining.`
        : `Spend is tracking plan for the remaining ${daysRemaining} day(s).`;
  const budgetStateLabel =
    totalVarianceToDate > 0 ? "Over Budget" : totalVarianceToDate < 0 ? "Under Budget" : "On Budget";
  const budgetStateClass =
    totalVarianceToDate > 0
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : totalVarianceToDate < 0
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-700";
  const paceStateLabel =
    spendVsExpected > 0 ? "Above Pace" : spendVsExpected < 0 ? "Below Pace" : "On Pace";
  const paceStateClass =
    spendVsExpected > 0
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : spendVsExpected < 0
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-700";
  const topOverspendOwner = budgetRows.reduce<{ owner: string; variance: number } | null>(
    (best, row) => {
      const variance = toNumber(row.consumed) - toNumber(row.budget);
      if (!best || variance > best.variance) return { owner: row.owner, variance };
      return best;
    },
    null
  );
  const topHeadroomOwner = budgetRows.reduce<{ owner: string; variance: number } | null>(
    (best, row) => {
      const variance = toNumber(row.consumed) - toNumber(row.budget);
      if (!best || variance < best.variance) return { owner: row.owner, variance };
      return best;
    },
    null
  );
  const unacknowledgedAlerts = toNumber(modules.alertsEscalation.unacknowledgedCount);

  const budgetKpis = useMemo(
    () => [
      {
        key: "planned_budget" as BudgetKpiKey,
        label: "Planned Budget",
        value: formatCurrency(totalBudget, currency),
        detail: `${modules.budgetSetupOwnership.budgetType || "fixed"} envelope`,
        tone: "text-slate-900",
      },
      {
        key: "consumed" as BudgetKpiKey,
        label: "Consumed To-Date",
        value: formatCurrency(totalConsumed, currency),
        detail: `Burn ${formatPercent(burnPct)}`,
        tone: "text-slate-900",
      },
      {
        key: "variance_to_date" as BudgetKpiKey,
        label: "Variance To-Date",
        value: formatSignedCurrency(totalVarianceToDate, currency),
        detail: budgetStateLabel,
        tone: totalVarianceToDate > 0 ? "text-rose-700" : totalVarianceToDate < 0 ? "text-emerald-700" : "text-slate-900",
      },
      {
        key: "expected_by_now" as BudgetKpiKey,
        label: "Expected By Now",
        value: formatCurrency(expectedSpendToDate, currency),
        detail: "Time-weighted budget pace",
        tone: "text-slate-900",
      },
      {
        key: "pace_gap" as BudgetKpiKey,
        label: "Pace Gap",
        value: `${formatCurrency(spendVsExpectedAbs, currency)} ${spendVsExpectedLabel}`,
        detail: paceStateLabel,
        tone: spendVsExpected > 0 ? "text-rose-700" : spendVsExpected < 0 ? "text-emerald-700" : "text-slate-900",
      },
      {
        key: "remaining_budget" as BudgetKpiKey,
        label: "Remaining Budget",
        value: formatCurrency(remainingBudget, currency),
        detail: `${daysRemaining} day(s) left`,
        tone: "text-slate-900",
      },
      {
        key: "at_risk_owners" as BudgetKpiKey,
        label: "At-Risk Owners",
        value: `${atRiskCount}/${budgetRows.length || 0}`,
        detail: "Owners at risk or breached",
        tone: atRiskCount > 0 ? "text-amber-700" : "text-emerald-700",
      },
    ],
    [
      atRiskCount,
      budgetRows.length,
      burnPct,
      currency,
      daysRemaining,
      expectedSpendToDate,
      modules.budgetSetupOwnership.budgetType,
      remainingBudget,
      spendVsExpected,
      spendVsExpectedAbs,
      spendVsExpectedLabel,
      totalBudget,
      totalConsumed,
      totalVarianceToDate,
      budgetStateLabel,
      paceStateLabel,
    ]
  );

  const budgetKpiInsights = useMemo(
    () =>
      ({
        planned_budget: {
          title: "Planned Budget",
          value: formatCurrency(totalBudget, currency),
          summary: "Total approved budget for current scope.",
          contextLabel: `${daysRemaining} day(s) remaining`,
          badgeText: modules.budgetSetupOwnership.budgetType || "fixed",
          points: [
            `Formula: Sum of owner budgets in selected scope`,
            `Budget type: ${modules.budgetSetupOwnership.budgetType || "fixed"}`,
            `Owner rows: ${budgetRows.length}`,
          ],
        },
        consumed: {
          title: "Consumed To-Date",
          value: formatCurrency(totalConsumed, currency),
          summary: "Actual consumed spend booked so far this period.",
          contextLabel: `Burn ${formatPercent(burnPct)}`,
          badgeText: paceStateLabel,
          points: [
            `Formula: Sum(consumed) across owner budget rows`,
            `Consumed: ${formatCurrency(totalConsumed, currency)}`,
            `Remaining budget: ${formatCurrency(remainingBudget, currency)}`,
          ],
        },
        variance_to_date: {
          title: "Budget Variance (To-Date)",
          value: formatSignedCurrency(totalVarianceToDate, currency),
          summary: "Difference between consumed spend and planned budget to date.",
          contextLabel: `As of current filter window`,
          badgeText: budgetStateLabel,
          points: [
            `Formula: Consumed To-Date - Planned Budget`,
            `Consumed: ${formatCurrency(totalConsumed, currency)}`,
            `Planned: ${formatCurrency(totalBudget, currency)}`,
            `Variance: ${formatSignedCurrency(totalVarianceToDate, currency)}`,
          ],
        },
        expected_by_now: {
          title: "Expected Spend By Now",
          value: formatCurrency(expectedSpendToDate, currency),
          summary: "Time-weighted expected spend based on elapsed period percent.",
          contextLabel: `Days remaining: ${daysRemaining}`,
          badgeText: paceStateLabel,
          points: [
            `Formula: Sum(Budget * TimeElapsed%) per owner`,
            `Expected: ${formatCurrency(expectedSpendToDate, currency)}`,
            `Actual consumed: ${formatCurrency(totalConsumed, currency)}`,
            `Gap: ${formatCurrency(spendVsExpectedAbs, currency)} ${spendVsExpectedLabel}`,
          ],
        },
        pace_gap: {
          title: "Pace Gap",
          value: `${formatCurrency(spendVsExpectedAbs, currency)} ${spendVsExpectedLabel}`,
          summary: "How far actual spend is from expected budget burn pace.",
          contextLabel: `Burn vs plan ${formatSignedPercent(burnVsPlanPct)}`,
          badgeText: paceStateLabel,
          points: [
            `Formula: Consumed To-Date - Expected By Now`,
            `Expected by now: ${formatCurrency(expectedSpendToDate, currency)}`,
            `Actual consumed: ${formatCurrency(totalConsumed, currency)}`,
            `Action signal: ${alignmentHeadline}`,
          ],
        },
        remaining_budget: {
          title: "Remaining Budget",
          value: formatCurrency(remainingBudget, currency),
          summary: "Budget headroom left for the remaining days in period.",
          contextLabel: `${daysRemaining} day(s) left`,
          badgeText: budgetStateLabel,
          points: [
            `Formula: Planned Budget - Consumed To-Date`,
            `Remaining: ${formatCurrency(remainingBudget, currency)}`,
            `Current pace: ${paceStateLabel}`,
          ],
        },
        at_risk_owners: {
          title: "At-Risk Owners",
          value: `${atRiskCount}/${budgetRows.length || 0}`,
          summary: "Budget owners currently at risk or breached thresholds.",
          contextLabel: "Owner accountability coverage",
          badgeText: atRiskCount > 0 ? "Watch" : "Healthy",
          points: [
            `Formula: Count(status in [at_risk, breached])`,
            `At-risk owners: ${atRiskCount}`,
            `Total owners: ${budgetRows.length || 0}`,
            `Use table below for owner-level follow-up`,
          ],
        },
      }) as Record<
        BudgetKpiKey,
        {
          title: string;
          value: string;
          summary: string;
          contextLabel: string;
          badgeText: string;
          points: string[];
        }
      >,
    [
      alignmentHeadline,
      atRiskCount,
      budgetRows.length,
      burnPct,
      burnVsPlanPct,
      currency,
      daysRemaining,
      expectedSpendToDate,
      modules.budgetSetupOwnership.budgetType,
      paceStateLabel,
      remainingBudget,
      spendVsExpectedAbs,
      spendVsExpectedLabel,
      totalBudget,
      totalConsumed,
      totalVarianceToDate,
      budgetStateLabel,
    ]
  );
  const activeBudgetInsight = activeBudgetKpi ? budgetKpiInsights[activeBudgetKpi] : null;

  if (mode === "forecasting") {
    return (
      <SectionPanel title="Forecast-to-Actual (MAPE / Bias)">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric
            label="MAPE"
            value={
              modules.forecastActualTracking.mapePct == null
                ? "N/A"
                : formatPercent(modules.forecastActualTracking.mapePct)
            }
            detail="Average absolute forecast error"
          />
          <Metric
            label="Bias"
            value={
              modules.forecastActualTracking.biasPct == null
                ? "N/A"
                : formatSignedPercent(modules.forecastActualTracking.biasPct)
            }
            detail="Positive indicates over-forecasting"
          />
          <Metric
            label="Accuracy Score"
            value={
              modules.forecastActualTracking.accuracyScore == null
                ? "N/A"
                : modules.forecastActualTracking.accuracyScore.toFixed(2)
            }
            detail="Composite forecast quality signal"
          />
        </div>
        <div className="mt-3 max-h-[280px] overflow-x-auto overflow-y-auto pr-1">
          <table className="min-w-[760px] divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <th className="px-2 py-1.5">Scope</th>
                <th className="px-2 py-1.5">Actual</th>
                <th className="px-2 py-1.5">Forecast</th>
                <th className="px-2 py-1.5">Error %</th>
                <th className="px-2 py-1.5">Bias %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trackingRows.map((row) => (
                <tr key={row.scope}>
                  <td className="px-2 py-1.5 text-slate-700">{row.scope}</td>
                  <td className="px-2 py-1.5 text-slate-700">{formatCurrency(row.actual, currency)}</td>
                  <td className="px-2 py-1.5 text-slate-700">{formatCurrency(row.forecast, currency)}</td>
                  <td className="px-2 py-1.5 text-slate-700">{formatPercent(row.errorPct)}</td>
                  <td className="px-2 py-1.5 text-slate-700">{formatSignedPercent(row.biasPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    );
  }

  return (
    <>
      <SectionPanel title="Budget KPIs & Insights">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${budgetStateClass}`}
            >
              {budgetStateLabel}
            </span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${paceStateClass}`}
            >
              {paceStateLabel}
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
              {daysRemaining} day(s) left
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
              Budget type: {modules.budgetSetupOwnership.budgetType || "fixed"}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{alignmentHeadline}</p>
          <p className="mt-1 text-xs text-slate-600">{alignmentDetail}</p>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {budgetKpis.map((kpi) => (
            <button
              key={kpi.key}
              type="button"
              onClick={() => setActiveBudgetKpi(kpi.key)}
              className="group rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:-translate-y-[1px] hover:border-emerald-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{kpi.label}</p>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                  Click
                </span>
              </div>
              <p className={`mt-2 text-2xl font-black ${kpi.tone}`}>{kpi.value}</p>
              <p className="mt-1 text-xs text-slate-600">{kpi.detail}</p>
            </button>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel title="Budget Outcomes By Owner">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Top Overspend Owner</p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {topOverspendOwner && topOverspendOwner.variance > 0 ? topOverspendOwner.owner : "None"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {topOverspendOwner && topOverspendOwner.variance > 0
                ? formatSignedCurrency(topOverspendOwner.variance, currency)
                : "No owner is over budget"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Largest Headroom</p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {topHeadroomOwner && topHeadroomOwner.variance < 0 ? topHeadroomOwner.owner : "None"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {topHeadroomOwner && topHeadroomOwner.variance < 0
                ? formatSignedCurrency(topHeadroomOwner.variance, currency)
                : "No remaining headroom signal"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Alert Focus</p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {unacknowledgedAlerts > 0 ? `${unacknowledgedAlerts} pending` : "All acknowledged"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {unacknowledgedAlerts > 0 ? "Review thresholds and owners" : "No pending budget escalations"}
            </p>
          </div>
        </div>
        <BudgetTable rows={budgetRows} currency={currency} />
      </SectionPanel>

      <SectionPanel title="Budget Alert Center (Preview)">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric
            label="Unacknowledged Alerts"
            value={`${modules.alertsEscalation.unacknowledgedCount}`}
            detail="Alerts waiting for owner response"
          />
          <Metric
            label="Total Active Alerts"
            value={`${alertRows.length}`}
            detail="Budget threshold and confidence gate events"
          />
          <Metric
            label="Workflow States"
            value={`${modules.alertsEscalation.states.length}`}
            detail={modules.alertsEscalation.states.join(" -> ")}
          />
        </div>
        <AlertsTable alerts={alertRows} />
      </SectionPanel>

      <KpiInsightModal
        open={Boolean(activeBudgetInsight)}
        title={activeBudgetInsight?.title || ""}
        value={activeBudgetInsight?.value}
        summary={activeBudgetInsight?.summary}
        contextLabel={activeBudgetInsight?.contextLabel}
        badgeText={activeBudgetInsight?.badgeText}
        points={activeBudgetInsight?.points || []}
        onClose={() => setActiveBudgetKpi(null)}
      />
    </>
  );
}

function BudgetTable({ rows, currency }: { rows: BudgetRow[]; currency: string }) {
  if (!rows.length) {
    return <p className="mt-3 text-sm text-slate-600">No owner budgets available for this scope.</p>;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Owner-Level Budget Table</p>
        <p className="text-xs font-semibold text-slate-600">{rows.length} rows</p>
      </div>
      <div className="max-h-[420px] overflow-x-auto overflow-y-auto">
      <table className="w-full min-w-[1020px] divide-y divide-slate-200 text-left text-sm">
        <thead className="sticky top-0 z-[1] bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
          <tr>
            <th className="w-[44px] px-3 py-2">#</th>
            <th className="px-3 py-2">Scope</th>
            <th className="px-3 py-2">Owner</th>
            <th className="px-3 py-2 text-right">Budget</th>
            <th className="px-3 py-2 text-right">Consumed</th>
            <th className="px-3 py-2 text-right">Variance</th>
            <th className="w-[180px] px-3 py-2">Burn %</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const varianceToDate = toNumber(row.consumed) - toNumber(row.budget);
            const burnPct = Math.max(0, Math.min(100, toNumber(row.consumptionPct)));
            const burnTone =
              burnPct >= 100
                ? "bg-rose-500"
                : burnPct >= 90
                  ? "bg-amber-500"
                  : burnPct >= 80
                    ? "bg-cyan-500"
                    : "bg-emerald-500";
            const scopeParts = String(row.scope || "")
              .split("/")
              .map((part) => part.trim())
              .filter(Boolean);
            const scopePrimary = scopeParts.length >= 2 ? `${scopeParts[0]} / ${scopeParts[1]}` : row.scope;
            const scopeSecondary = scopeParts.length >= 3 ? `Environment: ${scopeParts[2]}` : null;
            return (
            <tr key={row.id} className="odd:bg-white even:bg-slate-50/30 hover:bg-emerald-50/40">
              <td className="px-3 py-2 text-xs font-bold text-slate-500">{index + 1}</td>
              <td className="px-3 py-2 text-slate-800">
                <p className="font-semibold">{scopePrimary}</p>
                {scopeSecondary ? <p className="mt-0.5 text-xs text-slate-500">{scopeSecondary}</p> : null}
              </td>
              <td className="px-3 py-2 text-slate-700">
                <span className="inline-flex rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold">
                  {row.owner}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-700">
                {formatCurrency(row.budget, currency)}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-700">
                {formatCurrency(row.consumed, currency)}
              </td>
              <td
                className={`px-3 py-2 text-right font-semibold tabular-nums ${
                  varianceToDate > 0 ? "text-rose-700" : varianceToDate < 0 ? "text-emerald-700" : "text-slate-700"
                }`}
              >
                {formatSignedCurrency(varianceToDate, currency)}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                  <span>{formatPercent(burnPct)}</span>
                  <span className="text-slate-500">{burnPct.toFixed(1)}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                  <div className={`h-1.5 rounded-full ${burnTone}`} style={{ width: `${burnPct}%` }} />
                </div>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    row.status === "breached"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : row.status === "at_risk"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : row.status === "watch"
                          ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {row.status.replace("_", " ")}
                </span>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function AlertsTable({ alerts }: { alerts: AlertModel[] }) {
  if (!alerts.length) {
    return <p className="text-sm text-slate-600">No active alerts for this period.</p>;
  }

  return (
    <div className="max-h-[280px] overflow-x-auto overflow-y-auto pr-1">
      <table className="min-w-[920px] divide-y divide-slate-200 text-left text-sm">
        <thead className="sticky top-0 z-[1] bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
          <tr>
            <th className="px-2 py-1.5">Type</th>
            <th className="px-2 py-1.5">Severity</th>
            <th className="px-2 py-1.5">Scope</th>
            <th className="px-2 py-1.5">Owner</th>
            <th className="px-2 py-1.5">Status</th>
            <th className="px-2 py-1.5">Threshold</th>
            <th className="px-2 py-1.5">Current</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {alerts.map((alert) => (
            <tr key={alert.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-emerald-50/40">
              <td className="px-2 py-1.5 text-slate-700">{alert.type}</td>
              <td className="px-2 py-1.5 text-slate-700">{alert.severity}</td>
              <td className="px-2 py-1.5 text-slate-700">{alert.scope}</td>
              <td className="px-2 py-1.5 text-slate-700">{alert.owner}</td>
              <td className="px-2 py-1.5 text-slate-700">{alert.status}</td>
              <td className="px-2 py-1.5 text-slate-700">{alert.threshold}</td>
              <td className="px-2 py-1.5 text-slate-700">{alert.current}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
