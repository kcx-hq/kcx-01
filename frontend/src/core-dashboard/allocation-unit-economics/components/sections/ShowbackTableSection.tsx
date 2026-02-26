import React, { useMemo, useState } from 'react';
import type { CoverageModel, SharedPoolModel, ShowbackRow } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';
import KpiInsightModal from '../../../common/components/KpiInsightModal';

interface ShowbackTableSectionProps {
  rows: ShowbackRow[];
  coverage: CoverageModel;
  sharedPool: SharedPoolModel;
  costBasis: 'actual' | 'amortized' | 'net';
  periodLabel: string;
  timeWindowLabel: string;
}

type KpiKey =
  | 'total_allocated'
  | 'chargeback_applied'
  | 'showback_only'
  | 'pending_adjustment'
  | 'budget_variance'
  | 'billing_status';

interface TeamChargebackRow {
  team: string;
  finalCost: number;
  budget: number | null;
  variance: number | null;
  variancePct: number | null;
  status: 'on_track' | 'over_budget' | 'under_budget' | 'no_budget';
}

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const statusBadgeClass: Record<TeamChargebackRow['status'], string> = {
  on_track: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  over_budget: 'border-rose-200 bg-rose-50 text-rose-700',
  under_budget: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  no_budget: 'border-slate-200 bg-slate-50 text-slate-600',
};

const formatStatus = (status: TeamChargebackRow['status']): string => {
  if (status === 'on_track') return 'On Track';
  if (status === 'over_budget') return 'Over Budget';
  if (status === 'under_budget') return 'Under Budget';
  return 'No Budget';
};

const mapCostBasisLabel = (costBasis: ShowbackTableSectionProps['costBasis']): string => {
  if (costBasis === 'amortized') return 'Amortized';
  if (costBasis === 'net') return 'Net';
  return 'Actual';
};

export default function ShowbackTableSection({
  rows,
  coverage,
  sharedPool,
  costBasis,
  periodLabel,
  timeWindowLabel,
}: ShowbackTableSectionProps) {
  const [activeKpi, setActiveKpi] = useState<KpiKey | null>(null);

  const effectiveDateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [],
  );

  const teamRows = useMemo<TeamChargebackRow[]>(() => {
    const grouped = new Map<string, { finalCost: number; budget: number; hasBudget: boolean }>();
    rows.forEach((row) => {
      const team = String(row.team || 'Unassigned Team');
      const entry = grouped.get(team) || { finalCost: 0, budget: 0, hasBudget: false };
      entry.finalCost += Number(row.totalCost || 0);
      if (row.budget !== null) {
        entry.hasBudget = true;
        entry.budget += Number(row.budget || 0);
      }
      grouped.set(team, entry);
    });

    return Array.from(grouped.entries())
      .map(([team, value]) => {
        const budget = value.hasBudget ? round(value.budget, 2) : null;
        const variance = budget === null ? null : round(value.finalCost - budget, 2);
        const variancePct = budget && budget !== 0 ? round(((variance || 0) / budget) * 100, 2) : null;
        let status: TeamChargebackRow['status'] = 'no_budget';
        if (variancePct !== null) {
          if (variancePct > 5) status = 'over_budget';
          else if (variancePct < -5) status = 'under_budget';
          else status = 'on_track';
        }

        return {
          team,
          finalCost: round(value.finalCost, 2),
          budget,
          variance,
          variancePct,
          status,
        };
      })
      .sort((a, b) => b.finalCost - a.finalCost);
  }, [rows]);

  const shouldScrollRows = teamRows.length > 12;

  const metrics = useMemo(() => {
    const totalAllocated = round(rows.reduce((sum, row) => sum + Number(row.totalCost || 0), 0), 2);
    const pendingAdjustment = round(Math.max(0, Number(coverage.unallocatedAmount || 0)), 2);
    const chargebackExecutedAmount = round(Math.max(0, totalAllocated - pendingAdjustment), 2);
    const showbackDistributed = totalAllocated;
    const chargebackAppliedPct =
      totalAllocated > 0 ? round((chargebackExecutedAmount / totalAllocated) * 100, 2) : 0;
    const showbackOnlyPct = round(Math.max(0, 100 - chargebackAppliedPct), 2);

    const budgetRows = teamRows.filter((row) => row.budget !== null);
    const totalBudget = round(budgetRows.reduce((sum, row) => sum + Number(row.budget || 0), 0), 2);
    const totalVariance = round(budgetRows.reduce((sum, row) => sum + Number(row.variance || 0), 0), 2);
    const budgetVarianceByTeamPct =
      totalBudget > 0 ? round((totalVariance / totalBudget) * 100, 2) : null;

    const pendingPct = totalAllocated > 0 ? (pendingAdjustment / totalAllocated) * 100 : 0;
    const internalBillingStatus =
      totalAllocated === 0
        ? 'No Data'
        : pendingPct <= 1
          ? 'Chargeback Ready'
          : pendingPct <= 10
            ? 'Partial Chargeback'
            : 'Showback Only';

    return {
      totalAllocated,
      showbackDistributed,
      chargebackExecutedAmount,
      pendingAdjustment,
      chargebackAppliedPct,
      showbackOnlyPct,
      budgetVarianceByTeamPct,
      totalVariance,
      internalBillingStatus,
    };
  }, [rows, coverage.unallocatedAmount, teamRows]);

  const disclosure = useMemo(
    () => ({
      costBasisUsed: mapCostBasisLabel(costBasis),
      sharedRedistributionIncluded: sharedPool.total > 0 ? 'Yes' : 'No',
      timeWindow: `${periodLabel} | ${timeWindowLabel}`,
      effectiveDate: effectiveDateLabel,
    }),
    [costBasis, sharedPool.total, periodLabel, timeWindowLabel, effectiveDateLabel],
  );

  const kpis = useMemo(
    () => [
      {
        key: 'total_allocated' as const,
        label: 'Total Allocated for Period',
        value: formatCurrency(metrics.totalAllocated),
        summary: 'Final allocated cost in current scope after direct and shared allocation.',
        points: [
          `Total allocated: ${formatCurrency(metrics.totalAllocated)}`,
          `Showback distributed: ${formatCurrency(metrics.showbackDistributed)}`,
          `Chargeback executed: ${formatCurrency(metrics.chargebackExecutedAmount)}`,
        ],
      },
      {
        key: 'chargeback_applied' as const,
        label: 'Chargeback Applied %',
        value: formatPercent(metrics.chargebackAppliedPct),
        summary: 'Share of allocated cost currently ready/executed for internal billing.',
        points: [
          `Chargeback applied: ${formatPercent(metrics.chargebackAppliedPct)}`,
          `Executed amount: ${formatCurrency(metrics.chargebackExecutedAmount)}`,
          `Pending adjustment: ${formatCurrency(metrics.pendingAdjustment)}`,
        ],
      },
      {
        key: 'showback_only' as const,
        label: 'Showback Only %',
        value: formatPercent(metrics.showbackOnlyPct),
        summary: 'Cost currently visible via showback but not fully chargeback-executed.',
        points: [
          `Showback-only share: ${formatPercent(metrics.showbackOnlyPct)}`,
          `Showback distributed: ${formatCurrency(metrics.showbackDistributed)}`,
        ],
      },
      {
        key: 'pending_adjustment' as const,
        label: 'Pending Adjustment',
        value: formatCurrency(metrics.pendingAdjustment),
        summary: 'Unallocated or unresolved amount pending policy completion.',
        points: [
          `Pending allocation amount: ${formatCurrency(metrics.pendingAdjustment)}`,
          `Unallocated spend impact from coverage: ${formatCurrency(coverage.unallocatedAmount)}`,
        ],
      },
      {
        key: 'budget_variance' as const,
        label: 'Budget Variance by Team',
        value:
          metrics.budgetVarianceByTeamPct === null
            ? 'N/A'
            : `${formatPercent(metrics.budgetVarianceByTeamPct)} (${formatCurrency(metrics.totalVariance)})`,
        summary: 'Aggregated team-level variance against budget baseline where budgets exist.',
        points: [
          metrics.budgetVarianceByTeamPct === null
            ? 'No team budget data available in current scope.'
            : `Variance by team: ${formatPercent(metrics.budgetVarianceByTeamPct)}`,
          `Teams in table: ${teamRows.length}`,
        ],
      },
      {
        key: 'billing_status' as const,
        label: 'Internal Billing Status',
        value: metrics.internalBillingStatus,
        summary: 'Operational readiness of the current scope for internal chargeback cycle.',
        points: [
          `Current status: ${metrics.internalBillingStatus}`,
          `Chargeback applied: ${formatPercent(metrics.chargebackAppliedPct)}`,
          `Pending adjustment: ${formatCurrency(metrics.pendingAdjustment)}`,
        ],
      },
    ],
    [metrics, coverage.unallocatedAmount, teamRows.length],
  );

  const activeInsight = useMemo(
    () => kpis.find((kpi) => kpi.key === activeKpi) || null,
    [kpis, activeKpi],
  );

  const cardClass = (key: KpiKey) =>
    [
      'rounded-xl border p-3 text-left transition',
      activeKpi === key
        ? 'border-emerald-400 bg-emerald-50 shadow-[0_8px_30px_rgba(16,185,129,0.12)]'
        : 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-white',
    ].join(' ');

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">
        Showback & Chargeback Overview
      </h3>

      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <button
            key={kpi.key}
            type="button"
            className={cardClass(kpi.key)}
            onClick={() => setActiveKpi((current) => (current === kpi.key ? null : kpi.key))}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{kpi.label}</p>
            <p className="mt-1 text-lg font-black text-slate-900">{kpi.value}</p>
            <p className="mt-1 text-[10px] font-semibold text-slate-500">Click for insight</p>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div
          className={[
            'overflow-x-auto',
            shouldScrollRows ? 'max-h-[570px] overflow-y-auto custom-scrollbar' : '',
          ].join(' ')}
        >
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2 text-right">Final Cost</th>
                <th className="px-3 py-2 text-right">Budget</th>
                <th className="px-3 py-2 text-right">Variance</th>
                <th className="px-3 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamRows.length ? (
                teamRows.map((row) => (
                  <tr key={row.team}>
                    <td className="px-3 py-2 font-semibold text-slate-800">{row.team}</td>
                    <td className="px-3 py-2 text-right font-black text-slate-900">
                      {formatCurrency(row.finalCost)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-500">
                      {row.budget === null ? 'N/A' : formatCurrency(row.budget)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-600">
                      {row.variance === null
                        ? 'N/A'
                        : `${formatCurrency(row.variance)} (${formatPercent(row.variancePct)})`}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={[
                          'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                          statusBadgeClass[row.status],
                        ].join(' ')}
                      >
                        {formatStatus(row.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                    No showback or chargeback rows available for the selected scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          Allocation Policy Disclosure
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          <p className="text-xs font-semibold text-slate-700">
            Cost Basis Used: <span className="font-black text-slate-900">{disclosure.costBasisUsed}</span>
          </p>
          <p className="text-xs font-semibold text-slate-700">
            Shared Redistribution Included:{' '}
            <span className="font-black text-slate-900">{disclosure.sharedRedistributionIncluded}</span>
          </p>
          <p className="text-xs font-semibold text-slate-700">
            Time Window: <span className="font-black text-slate-900">{disclosure.timeWindow}</span>
          </p>
          <p className="text-xs font-semibold text-slate-700">
            Effective Date: <span className="font-black text-slate-900">{disclosure.effectiveDate}</span>
          </p>
        </div>
      </div>

      <KpiInsightModal
        open={Boolean(activeInsight)}
        title={activeInsight?.label || ''}
        value={activeInsight?.value || null}
        summary={activeInsight?.summary || null}
        points={activeInsight?.points || []}
        contextLabel={`${periodLabel} | ${timeWindowLabel} | Effective: ${effectiveDateLabel}`}
        onClose={() => setActiveKpi(null)}
        maxWidthClass="max-w-lg"
      />
    </section>
  );
}

