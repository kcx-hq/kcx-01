import React, { useMemo, useState } from 'react';
import type { SharedPoolModel } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';
import KpiInsightModal from '../shared/KpiInsightModal';

interface SharedPoolSectionProps {
  model: SharedPoolModel;
  contextLabel?: string;
}

type InsightKey = 'pool' | 'redistributed' | 'teams' | 'concentration';

export default function SharedPoolSection({ model, contextLabel }: SharedPoolSectionProps) {
  const [activeInsight, setActiveInsight] = useState<InsightKey | null>(null);
  const shouldScrollTeams = model.rows.length > 6;

  const metrics = useMemo(() => {
    const totalDirect = model.rows.reduce((sum, row) => sum + (row.directCost || 0), 0);
    const totalShared = model.rows.reduce((sum, row) => sum + (row.sharedAllocatedCost || 0), 0);
    const teamsImpacted = model.rows.filter((row) => (row.sharedAllocatedCost || 0) > 0).length;

    const topByShared = [...model.rows].sort(
      (a, b) => (b.sharedAllocatedCost || 0) - (a.sharedAllocatedCost || 0),
    )[0] || null;

    const sharedToDirectPct = totalDirect > 0 ? (totalShared / totalDirect) * 100 : 0;
    const concentrationPct =
      topByShared && totalShared > 0
        ? ((topByShared.sharedAllocatedCost || 0) / totalShared) * 100
        : 0;

    return {
      totalDirect,
      totalShared,
      teamsImpacted,
      sharedToDirectPct,
      concentrationPct,
      topByShared,
      redistributedCoveragePct: model.total > 0 ? (model.redistributedAmount / model.total) * 100 : 0,
    };
  }, [model]);

  const insight = useMemo(() => {
    if (!activeInsight) return null;

    if (activeInsight === 'pool') {
      return {
        title: 'Shared Pool Total',
        value: formatCurrency(model.total),
        summary: 'Total shared costs that require redistribution before final ownership reporting.',
        points: [
          `Detected shared pool in scope: ${formatCurrency(model.total)}.`,
          `Current rule: ${model.ruleApplied}.`,
          model.total <= 0
            ? 'No shared pool found in this slice. Client can treat direct allocation as complete.'
            : `Shared pool is ${formatPercent(metrics.sharedToDirectPct)} of direct allocated spend.`,
        ],
      };
    }

    if (activeInsight === 'redistributed') {
      return {
        title: 'Redistributed',
        value: `${formatCurrency(model.redistributedAmount)} (${formatPercent(metrics.redistributedCoveragePct)})`,
        summary: 'Execution status of shared cost redistribution against detected pool.',
        points: [
          `Redistributed amount: ${formatCurrency(model.redistributedAmount)}.`,
          `Coverage of shared pool redistribution: ${formatPercent(metrics.redistributedCoveragePct)}.`,
          model.redistributedAmount < model.total
            ? 'Residual remains. Review allocation rule inputs before chargeback export.'
            : 'All detected shared pool is currently redistributed.',
        ],
      };
    }

    if (activeInsight === 'teams') {
      return {
        title: 'Teams Impacted',
        value: `${metrics.teamsImpacted} / ${model.rows.length}`,
        summary: 'Breadth of ownership impacted by shared cost redistribution.',
        points: [
          `${metrics.teamsImpacted} teams currently receive shared allocation.`,
          `Total teams in panel: ${model.rows.length}.`,
          metrics.teamsImpacted <= 1
            ? 'Low spread: verify if shared costs should be distributed across more teams.'
            : 'Shared cost distribution spans multiple owners, reducing single-team distortion.',
        ],
      };
    }

    return {
      title: 'Concentration',
      value: formatPercent(metrics.concentrationPct),
      summary: 'Share of redistributed pool captured by the top recipient.',
      points: [
        metrics.topByShared
          ? `Top recipient: ${metrics.topByShared.team} gets ${formatCurrency(metrics.topByShared.sharedAllocatedCost)}.`
          : 'No shared recipient in current scope.',
        `Top recipient share: ${formatPercent(metrics.concentrationPct)}.`,
        metrics.concentrationPct >= 60
          ? 'High concentration risk: validate weighting logic and business fairness.'
          : 'Concentration is controlled for current scope.',
      ],
    };
  }, [activeInsight, metrics, model]);

  const cardClass = (key: InsightKey) =>
    [
      'rounded-xl border bg-slate-50 p-2.5 text-left transition-all',
      activeInsight === key
        ? 'border-emerald-300 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-200'
        : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30',
    ].join(' ');

  const handleInsightToggle = (key: InsightKey) => {
    setActiveInsight((curr) => (curr === key ? null : key));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Shared Cost Reallocation</h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <button type="button" onClick={() => handleInsightToggle('pool')} className={cardClass('pool')}>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Shared Pool Total</p>
          <p className="mt-0.5 text-lg font-black leading-tight text-slate-900">{formatCurrency(model.total)}</p>
        </button>

        <button
          type="button"
          onClick={() => handleInsightToggle('redistributed')}
          className={cardClass('redistributed')}
        >
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Redistributed</p>
          <p className="mt-0.5 text-lg font-black leading-tight text-slate-900">{formatCurrency(model.redistributedAmount)}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-600">
            {formatPercent(metrics.redistributedCoveragePct)} of pool reassigned
          </p>
        </button>

        <button type="button" onClick={() => handleInsightToggle('teams')} className={cardClass('teams')}>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Teams Impacted</p>
          <p className="mt-0.5 text-lg font-black leading-tight text-slate-900">
            {metrics.teamsImpacted}
            <span className="ml-1 text-xs font-bold text-slate-500">/ {model.rows.length}</span>
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleInsightToggle('concentration')}
          className={cardClass('concentration')}
        >
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Concentration</p>
          <p className="mt-0.5 text-lg font-black leading-tight text-slate-900">{formatPercent(metrics.concentrationPct)}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-600">Top recipient share of shared pool</p>
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Rule Applied</p>
        <p className="mt-1 text-sm font-black text-slate-900">{model.ruleApplied}</p>
      </div>

      <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Before/After (Top Teams)</p>
        <div
          className={[
            shouldScrollTeams ? 'max-h-[360px] overflow-y-auto pr-1 custom-scrollbar' : '',
          ].join(' ')}
        >
          {model.rows.map((row) => (
            <div key={`${row.team}-${row.product}-${row.environment}`} className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 last:mb-0">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>{row.team}</span>
                <span>{formatCurrency(row.totalCost)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Direct: {formatCurrency(row.directCost)}</span>
                <span>Shared: {formatCurrency(row.sharedAllocatedCost)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded bg-slate-100">
                <div
                  className="h-full bg-emerald-400"
                  style={{
                    width: `${Math.min(100, Math.max(0, row.pctOfTotal))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        {!model.rows.length ? (
          <p className="text-sm font-semibold text-slate-500">No redistribution rows available.</p>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Finance Readout</p>
        <p className="mt-1 text-xs font-semibold text-slate-700">
          Shared-to-direct ratio: {formatPercent(metrics.sharedToDirectPct)} | Top recipient: {metrics.topByShared?.team || 'N/A'}
        </p>
      </div>

      <KpiInsightModal
        open={Boolean(activeInsight && insight)}
        title={insight?.title || ''}
        value={insight?.value || null}
        summary={insight?.summary || null}
        points={insight?.points || []}
        contextLabel={contextLabel}
        onClose={() => setActiveInsight(null)}
        maxWidthClass="max-w-xl"
      />
    </section>
  );
}
