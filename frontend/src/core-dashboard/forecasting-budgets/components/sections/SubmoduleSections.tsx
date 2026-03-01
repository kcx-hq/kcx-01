import type { AlertModel, BudgetRow, ForecastingBudgetsPayload } from "../../types";
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

export function SubmoduleSections({ data, currency, mode }: SubmoduleSectionsProps) {
  const modules = data.submodules;
  const budgetRows = modules.budgetSetupOwnership.rows || [];
  const alertRows = modules.alertsEscalation.alerts || [];
  const trackingRows = modules.forecastActualTracking.byScope || [];

  const totalBudget = budgetRows.reduce((sum, row) => sum + toNumber(row.budget), 0);
  const totalConsumed = budgetRows.reduce((sum, row) => sum + toNumber(row.consumed), 0);
  const totalForecast = budgetRows.reduce((sum, row) => sum + toNumber(row.forecast), 0);
  const totalVariance = totalForecast - totalBudget;
  const atRiskCount = budgetRows.filter(
    (row) => row.status === "at_risk" || row.status === "breached"
  ).length;
  const burnPct = totalBudget > 0 ? (totalConsumed / totalBudget) * 100 : 0;

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
        <div className="mt-3 max-h-[280px] overflow-y-auto pr-1">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
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
      <SectionPanel title="Budget Outcomes">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Metric
            label="Planned Budget"
            value={formatCurrency(totalBudget, currency)}
            detail="Current monthly budget envelope for selected scope"
          />
          <Metric
            label="Consumed To-Date"
            value={formatCurrency(totalConsumed, currency)}
            detail={`Burn: ${formatPercent(burnPct)}`}
          />
          <Metric
            label="Forecast vs Budget"
            value={formatSignedCurrency(totalVariance, currency)}
            detail="Positive means projected overrun"
          />
          <Metric
            label="At-Risk Owners"
            value={`${atRiskCount}/${budgetRows.length}`}
            detail="Owners in at-risk or breached status"
          />
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
    </>
  );
}

function BudgetTable({ rows, currency }: { rows: BudgetRow[]; currency: string }) {
  if (!rows.length) {
    return <p className="mt-3 text-sm text-slate-600">No owner budgets available for this scope.</p>;
  }

  return (
    <div className="mt-3 max-h-[280px] overflow-y-auto pr-1">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
          <tr>
            <th className="px-2 py-1.5">Scope</th>
            <th className="px-2 py-1.5">Owner</th>
            <th className="px-2 py-1.5">Budget</th>
            <th className="px-2 py-1.5">Forecast</th>
            <th className="px-2 py-1.5">Variance</th>
            <th className="px-2 py-1.5">Burn %</th>
            <th className="px-2 py-1.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.slice(0, 20).map((row) => (
            <tr key={row.id}>
              <td className="px-2 py-1.5 text-slate-700">{row.scope}</td>
              <td className="px-2 py-1.5 text-slate-700">{row.owner}</td>
              <td className="px-2 py-1.5 text-slate-700">{formatCurrency(row.budget, currency)}</td>
              <td className="px-2 py-1.5 text-slate-700">{formatCurrency(row.forecast, currency)}</td>
              <td className="px-2 py-1.5 text-slate-700">{formatSignedCurrency(row.variance, currency)}</td>
              <td className="px-2 py-1.5 text-slate-700">{formatPercent(row.consumptionPct)}</td>
              <td className="px-2 py-1.5">
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertsTable({ alerts }: { alerts: AlertModel[] }) {
  if (!alerts.length) {
    return <p className="text-sm text-slate-600">No active alerts for this period.</p>;
  }

  return (
    <div className="max-h-[280px] overflow-y-auto pr-1">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
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
            <tr key={alert.id}>
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
