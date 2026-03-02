import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Filter, Sparkles } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format";

const STAGES = ["identified", "validated", "planned", "implemented", "verified", "realized"];
const STAGE_LABEL = {
  identified: "Identified",
  validated: "Validated",
  planned: "Planned",
  implemented: "Implemented",
  verified: "Verified",
  realized: "Realized",
};
const STAGE_COLOR = {
  identified: "#94a3b8",
  validated: "#3b82f6",
  planned: "#f59e0b",
  implemented: "#f97316",
  verified: "#23a282",
  realized: "#047857",
};

export default function ActionCenterOverviewTab({ model, onSelectInsight }) {
  const [stageFilter, setStageFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const opportunities = model?.opportunities ?? [];

  const owners = useMemo(
    () => [...new Set(opportunities.map((opp) => opp.ownerTeam))].sort(),
    [opportunities],
  );

  const rankedRows = useMemo(() => {
    const rows = opportunities.filter((opp) => {
      const passStage = stageFilter === "all" || opp.stage === stageFilter;
      const passOwner = ownerFilter === "all" || opp.ownerTeam === ownerFilter;
      return passStage && passOwner;
    });
    return [...rows]
      .sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
        if (b.monthlyImpact !== a.monthlyImpact) return b.monthlyImpact - a.monthlyImpact;
        return a.etaDays - b.etaDays;
      })
      .slice(0, 10);
  }, [opportunities, ownerFilter, stageFilter]);

  const funnelData = STAGES.map((stage) => ({
    stage,
    label: STAGE_LABEL[stage],
    amount: model?.funnel?.stageTotals?.[stage] ?? 0,
    count: model?.funnel?.stageCounts?.[stage] ?? 0,
  }));

  const wasteCategories = model?.wasteCategories ?? [];
  const maxWaste = Math.max(1, ...wasteCategories.map((row) => row.savings));

  if (!model) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">
          No action center insights available for selected filters.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-700" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Executive Strip</h3>
        </div>
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          {model.executive.topSentence}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">CW Savings</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(model.executive.confidenceWeightedSavings)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Realized MTD</p>
            <p className="mt-1 text-xl font-black text-emerald-700">{formatCurrency(model.executive.realizedSavingsMtd)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Optimization Offset</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.executive.optimizationOffsetPct)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Spend Under Review</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.executive.spendUnderReviewPct)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Top 5 / Overdue</p>
            <p className="mt-1 text-xl font-black text-slate-900">
              {model.executive.top5Actions.length} / {model.executive.overdueActions}
            </p>
          </article>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Top 5 Actions This Week</h3>
          <div className="space-y-2">
            {model.executive.top5Actions?.length ? (
              model.executive.top5Actions.map((action, index) => (
                <article
                  key={action.id}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:border-emerald-200 hover:bg-emerald-50/40"
                  onClick={() => onSelectInsight?.(action)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-slate-800">
                        {index + 1}. {action.title}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-600">
                        {action.ownerTeam} | {action.workflowStatus} | ETA {action.etaDate}
                      </p>
                    </div>
                    <p className="text-xs font-black text-emerald-700">{formatCurrency(action.monthlyImpact)}</p>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                No executable actions in Validated/Planned/In Progress state.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Blocker Hotspots</h3>
          <div className="space-y-2">
            {model.blockerHeatmap?.length ? (
              model.blockerHeatmap.slice(0, 8).map((row, index) => (
                <article key={`${row.ownerTeam}-${row.blockerCategory}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-slate-800">{row.ownerTeam}</p>
                    <p className="text-[11px] font-black text-rose-600">{formatCurrency(row.impact)}</p>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">{row.blockerCategory}</p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">{row.count} blocked actions</p>
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                No active blockers in the current filter scope.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-emerald-700" />
          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="all">All Stages</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABEL[stage]}
              </option>
            ))}
          </select>
          <select
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="all">All Owner Teams</option>
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe2ea" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => formatCurrency(Number(value || 0))} />
              <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
              <Bar dataKey="amount">
                {funnelData.map((row) => (
                  <Cell key={row.stage} fill={STAGE_COLOR[row.stage]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Ranked Opportunities (Top 10)</h3>
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-[1160px] w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3 py-2">Opportunity</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2 text-right">Monthly Impact</th>
                <th className="px-3 py-2 text-right">Unit Impact</th>
                <th className="px-3 py-2">Confidence</th>
                <th className="px-3 py-2">Effort</th>
                <th className="px-3 py-2">Risk</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">ETA</th>
                <th className="px-3 py-2">Blocked By</th>
                <th className="px-3 py-2 text-right">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rankedRows.map((row) => (
                <tr key={row.id} className="cursor-pointer hover:bg-emerald-50/40" onClick={() => onSelectInsight?.(row)}>
                  <td className="px-3 py-2 font-semibold text-slate-800">{row.title}</td>
                  <td className="px-3 py-2 text-slate-700">{row.ownerTeam}</td>
                  <td className="px-3 py-2 text-right font-black text-slate-900">{formatCurrency(row.monthlyImpact)}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(row.unitCostImpact, 6)} {row.unitMetric}</td>
                  <td className="px-3 py-2">{row.confidence}</td>
                  <td className="px-3 py-2">{row.effort}</td>
                  <td className="px-3 py-2">{row.risk}</td>
                  <td className="px-3 py-2">{row.workflowStatus}</td>
                  <td className="px-3 py-2">{row.etaDate}</td>
                  <td className="px-3 py-2 text-rose-600">{row.blockedBy || "-"}</td>
                  <td className="px-3 py-2 text-right font-black">{formatNumber(row.priorityScore, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Waste Breakdown</h3>
          <div className="space-y-2">
            {model.wasteCategories.map((row) => (
              <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-slate-800">{row.label}</p>
                  <p className="text-xs font-black text-emerald-700">{formatCurrency(row.savings)}</p>
                </div>
                <div className="mt-1 h-2 rounded bg-slate-200">
                  <div className="h-full rounded bg-emerald-400" style={{ width: `${Math.min(100, (row.savings / maxWaste) * 100)}%` }} />
                </div>
                <p className="mt-1 text-[10px] font-semibold text-slate-500">
                  {row.ruleName} | {row.threshold} | {row.lookback}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Over-Provisioned Capacity Scatter</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe2ea" />
                <XAxis type="number" dataKey="utilization" name="Utilization" unit="%" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis type="number" dataKey="spend" name="Spend" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value, name) => (name === "Spend" ? formatCurrency(Number(value || 0)) : `${formatNumber(Number(value || 0), 2)}%`)} />
                <ReferenceLine x={40} stroke="#f59e0b" strokeDasharray="4 4" />
                <Scatter data={model.rightsizingScatter} fill="#0f766e" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Unit Cost Improvement Potential</h3>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {model.unitCards.map((row) => (
              <article key={row.product} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-800">{row.product}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Current: {formatNumber(row.baselineUnitCost, 6)} | Forecast: {formatNumber(row.adjustedUnitCost, 6)}
                </p>
                <p className="mt-1 text-sm font-black text-emerald-700">{formatPercent(row.confidenceWeightedImprovementPct)} improvement</p>
                <ul className="mt-2 space-y-1">
                  {row.topActions.map((action) => (
                    <li key={action.id} className="text-[11px] font-semibold text-slate-700">- {action.title}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Anomaly to Opportunity</h3>
          <div className="space-y-2">
            {model.anomalyBridgeCards.map((card) => (
              <article key={card.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-black text-slate-800">{card.title}</p>
                  <AlertTriangle size={14} className="text-amber-600" />
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-600">{card.suspectedCause}</p>
                <p className="mt-1 text-xs font-black text-emerald-700">{formatCurrency(card.estimatedSavings)}</p>
                <button type="button" className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  Create Action
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Verified vs Claimed Savings</h3>
          <div className="max-h-[260px] overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2">Opportunity</th>
                  <th className="px-3 py-2 text-right">Claimed</th>
                  <th className="px-3 py-2 text-right">Verified</th>
                  <th className="px-3 py-2 text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {model.verificationRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 font-semibold text-slate-800">{row.title}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.claimed)}</td>
                    <td className="px-3 py-2 text-right font-black text-emerald-700">{formatCurrency(row.verified)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.delta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Owner Scoreboard</h3>
          <div className="max-h-[260px] overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2 text-right">Realized</th>
                  <th className="px-3 py-2 text-right">Overdue</th>
                  <th className="px-3 py-2 text-right">Blocked</th>
                  <th className="px-3 py-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {model.ownerScoreboard.map((row) => (
                  <tr key={row.ownerTeam}>
                    <td className="px-3 py-2 font-semibold text-slate-800">{row.ownerTeam}</td>
                    <td className="px-3 py-2 text-right font-black text-emerald-700">{formatCurrency(row.realizedSavings)}</td>
                    <td className="px-3 py-2 text-right">{row.overdueActions}</td>
                    <td className="px-3 py-2 text-right text-rose-600">{row.blockedActions}</td>
                    <td className="px-3 py-2 text-right font-black">{formatNumber(row.accountabilityScore, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
