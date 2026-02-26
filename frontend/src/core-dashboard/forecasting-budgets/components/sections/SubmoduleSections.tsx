import type { AlertModel, BudgetRow, ForecastingBudgetsPayload } from "../../types";
import {
  formatCurrency,
  formatNullableNumber,
  formatPercent,
  formatSignedCurrency,
  formatSignedPercent,
} from "../../utils/format";
import { Metric, SectionPanel } from "../shared/ui";

interface SubmoduleSectionsProps {
  data: ForecastingBudgetsPayload;
  currency: string;
}

export function SubmoduleSections({ data, currency }: SubmoduleSectionsProps) {
  const modules = data.submodules;
  const budgetRows = modules.budgetSetupOwnership.rows || [];
  const scenarioRows = modules.scenarioPlanning.scenarios || [];
  const alertRows = modules.alertsEscalation.alerts || [];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionPanel title="1) Budget Setup & Ownership Budgets">
          <p className="text-sm text-slate-700">
            Budget type: <span className="font-semibold">{modules.budgetSetupOwnership.budgetType}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Hierarchy: {modules.budgetSetupOwnership.hierarchy.join(" -> ")}
          </p>
          <BudgetTable rows={budgetRows} currency={currency} />
        </SectionPanel>

        <SectionPanel title="2) Forecast Engine (Cost + Unit Cost + Volume)">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Metric
              label="Forecast Cost Band"
              value={`${formatCurrency(modules.forecastEngine.forecastAllocatedCost.lower, currency)} - ${formatCurrency(modules.forecastEngine.forecastAllocatedCost.upper, currency)}`}
              detail={`EOQ: ${formatCurrency(modules.forecastEngine.forecastAllocatedCost.eoq, currency)}`}
            />
            <Metric
              label="Forecast Volume Band"
              value={`${modules.forecastEngine.forecastVolume.lower.toFixed(2)} - ${modules.forecastEngine.forecastVolume.upper.toFixed(2)}`}
              detail="Planned denominator range"
            />
            <Metric
              label="Forecast Unit Cost Band"
              value={`${modules.forecastEngine.forecastUnitCost.lower.toFixed(6)} - ${modules.forecastEngine.forecastUnitCost.upper.toFixed(6)}`}
              detail={`Method: ${modules.forecastEngine.selectedMethod}`}
            />
            <Metric
              label="Volatility / Growth"
              value={`${formatPercent(modules.forecastEngine.drivers.volatilityPct)} / ${formatSignedPercent(modules.forecastEngine.drivers.costGrowthPct)}`}
              detail={`Volume growth: ${formatSignedPercent(modules.forecastEngine.drivers.volumeGrowthPct)}`}
            />
          </div>
          <div className="mt-3 rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Sensitivity</p>
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              {modules.forecastEngine.sensitivity.map((row) => (
                <p key={row.id}>
                  {row.label}: cost {formatSignedPercent(row.allocatedCostDeltaPct)} | unit {formatSignedPercent(row.unitCostDeltaPct)}
                </p>
              ))}
            </div>
          </div>
        </SectionPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionPanel title="3) Budget Burn & Run-Rate Controls">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Metric
              label="Burn vs Plan"
              value={formatSignedPercent(modules.budgetBurnControls.burnVsPlanPct)}
              detail="Run-rate correction needed when positive"
            />
            <Metric
              label="Days Remaining"
              value={modules.budgetBurnControls.daysRemaining.toFixed(0)}
              detail="Current period days left"
            />
            <Metric
              label="Breach ETA"
              value={formatNullableNumber(modules.budgetBurnControls.breachEtaDays, 1)}
              detail="At current burn rate"
            />
            <Metric
              label="Required Daily Spend"
              value={formatCurrency(modules.budgetBurnControls.requiredDailySpend, currency)}
              detail="To stay inside budget"
            />
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Overrun avoided if top actions complete by:{" "}
            <span className="font-semibold">
              {modules.budgetBurnControls.overrunAvoidedIfActionsCompleteBy || "N/A"}
            </span>
          </p>
        </SectionPanel>

        <SectionPanel title="4) Scenario Planning (What-if)">
          <div className="max-h-[280px] overflow-y-auto pr-1">
            <div className="space-y-2">
              {scenarioRows.map((row) => (
                <div
                  key={row.id}
                  className={`rounded-xl border p-3 ${
                    modules.scenarioPlanning.recommendedScenario === row.id
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Volume {formatSignedPercent(row.knobs.volumeGrowthPct, 0)} | Commitment{" "}
                    {formatSignedPercent(row.knobs.commitmentCoverageChangePct, 0)} | Optimization{" "}
                    {formatSignedPercent(row.knobs.optimizationExecutionRatePct, 0)}
                  </p>
                  <p className="mt-1 text-xs text-slate-700">
                    Forecast: {formatCurrency(row.outputs.forecastAllocatedCost, currency)} | Unit:{" "}
                    {row.outputs.forecastUnitCost.toFixed(6)} | Breach risk:{" "}
                    {formatPercent(row.outputs.breachRiskPct)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SectionPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionPanel title="5) Forecast-to-Actual Tracking (Accountability)">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric
              label="MAPE"
              value={
                modules.forecastActualTracking.mapePct == null
                  ? "N/A"
                  : formatPercent(modules.forecastActualTracking.mapePct)
              }
              detail="Lower is better"
            />
            <Metric
              label="Bias"
              value={
                modules.forecastActualTracking.biasPct == null
                  ? "N/A"
                  : formatSignedPercent(modules.forecastActualTracking.biasPct)
              }
              detail="Positive means over-forecasting"
            />
            <Metric
              label="Accuracy Score"
              value={
                modules.forecastActualTracking.accuracyScore == null
                  ? "N/A"
                  : modules.forecastActualTracking.accuracyScore.toFixed(2)
              }
              detail="100 - MAPE"
            />
          </div>
          <div className="mt-3 max-h-[240px] overflow-y-auto pr-1">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-2 py-1.5">Scope</th>
                  <th className="px-2 py-1.5">Error %</th>
                  <th className="px-2 py-1.5">Bias %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {modules.forecastActualTracking.byScope.map((row) => (
                  <tr key={row.scope}>
                    <td className="px-2 py-1.5 text-slate-700">{row.scope}</td>
                    <td className="px-2 py-1.5 text-slate-700">{formatPercent(row.errorPct)}</td>
                    <td className="px-2 py-1.5 text-slate-700">{formatSignedPercent(row.biasPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionPanel>

        <SectionPanel title="6) Budget Alerts & Escalation Workflow">
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Metric
              label="Unacknowledged Alerts"
              value={`${modules.alertsEscalation.unacknowledgedCount}`}
              detail={modules.alertsEscalation.states.join(" -> ")}
            />
            <Metric
              label="Total Alerts"
              value={`${alertRows.length}`}
              detail="Threshold, gate, and commitment-risk alerts"
            />
          </div>
          <AlertsTable alerts={alertRows} />
        </SectionPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionPanel title="Metric Dictionary">
          <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {data.metricDictionary.map((row) => (
              <div key={row.metric} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{row.metric}</p>
                <p className="mt-1 text-xs font-mono text-slate-600">{row.formula}</p>
                <p className="mt-1 text-xs text-slate-500">{row.scope}</p>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Cross-Section Connection Map">
          <div className="space-y-2">
            {data.crossSectionMap.map((row) => (
              <div key={row.source} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{row.source}</p>
                <p className="mt-1 text-xs text-slate-600">
                  <span className="font-semibold">Input:</span> {row.input}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  <span className="font-semibold">Output:</span> {row.output}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Non-duplication rules
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {data.nonDuplicationRules.map((rule) => (
                <li key={rule}>- {rule}</li>
              ))}
            </ul>
          </div>
        </SectionPanel>
      </div>
    </>
  );
}

function BudgetTable({ rows, currency }: { rows: BudgetRow[]; currency: string }) {
  return (
    <div className="mt-3 max-h-[260px] overflow-y-auto pr-1">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
          <tr>
            <th className="px-2 py-1.5">Scope</th>
            <th className="px-2 py-1.5">Budget</th>
            <th className="px-2 py-1.5">Forecast</th>
            <th className="px-2 py-1.5">Variance</th>
            <th className="px-2 py-1.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.slice(0, 20).map((row) => (
            <tr key={row.id}>
              <td className="px-2 py-1.5 text-slate-700">{row.scope}</td>
              <td className="px-2 py-1.5 text-slate-700">{formatCurrency(row.budget, currency)}</td>
              <td className="px-2 py-1.5 text-slate-700">{formatCurrency(row.forecast, currency)}</td>
              <td className="px-2 py-1.5 text-slate-700">{formatSignedCurrency(row.variance, currency)}</td>
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
  return (
    <div className="max-h-[260px] overflow-y-auto pr-1">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
          <tr>
            <th className="px-2 py-1.5">Type</th>
            <th className="px-2 py-1.5">Severity</th>
            <th className="px-2 py-1.5">Scope</th>
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

