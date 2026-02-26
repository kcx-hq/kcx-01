import React, { useMemo, useState } from 'react';
import type { CoverageModel } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';
import KpiInsightModal from '../shared/KpiInsightModal';

interface CoverageKpisSectionProps {
  coverage: CoverageModel;
  contextLabel?: string;
}

type InsightKey = 'team' | 'product' | 'owner' | 'unallocated';

const stateClass = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-rose-200 bg-rose-50 text-rose-700',
  na: 'border-slate-200 bg-slate-50 text-slate-600',
};

export default function CoverageKpisSection({ coverage, contextLabel }: CoverageKpisSectionProps) {
  const [activeInsight, setActiveInsight] = useState<InsightKey | null>(null);
  const items = [coverage.team, coverage.product, coverage.owner];

  const classify = (pct: number | null) => {
    if (pct === null || !Number.isFinite(pct)) return 'na';
    if (pct >= 95) return 'strong';
    if (pct >= 80) return 'watch';
    return 'risk';
  };

  const insight = useMemo(() => {
    if (!activeInsight) return null;

    if (activeInsight === 'unallocated') {
      const pct = coverage.unallocatedPct;
      const band = classify(pct);
      const lines =
        band === 'na'
          ? ['Unallocated percentage is unavailable for current scope.']
          : band === 'strong'
            ? [
                `${formatPercent(pct)} (${formatCurrency(coverage.unallocatedAmount)}) is unallocated.`,
                'Coverage is healthy; chargeback confidence is high.',
              ]
            : band === 'watch'
              ? [
                  `${formatPercent(pct)} (${formatCurrency(coverage.unallocatedAmount)}) is unallocated.`,
                  'Moderate governance gap. Prioritize mapping for high-cost rows this sprint.',
                ]
              : [
                  `${formatPercent(pct)} (${formatCurrency(coverage.unallocatedAmount)}) is unallocated.`,
                  'High risk for CFO reporting and ownership accountability. Treat as governance blocker.',
                ];

      return {
        title: 'Unallocated Spend Insight',
        value: `${formatCurrency(coverage.unallocatedAmount)} (${formatPercent(pct)})`,
        summary: 'Spend without clear ownership mapping in this scoped period.',
        points: lines,
      };
    }

    const metric = activeInsight === 'team' ? coverage.team : activeInsight === 'product' ? coverage.product : coverage.owner;
    const band = classify(metric.valuePct);
    const lines =
      band === 'na'
        ? [`${metric.label} is unavailable for this scope.`]
        : band === 'strong'
          ? [
              `${metric.label} is ${formatPercent(metric.valuePct)}.`,
              'Coverage is production-grade for showback and performance reviews.',
            ]
          : band === 'watch'
            ? [
                `${metric.label} is ${formatPercent(metric.valuePct)}.`,
                'Partial mapping. Improve tag coverage before finance sign-off.',
              ]
            : [
                `${metric.label} is ${formatPercent(metric.valuePct)}.`,
                'Low attribution trust. Decisions by team/product/owner can be misleading.',
              ];

    return {
      title: `${metric.label} Insight`,
      value: formatPercent(metric.valuePct),
      summary: 'Coverage quality for this allocation ownership dimension.',
      points: lines,
    };
  }, [activeInsight, coverage]);

  const cardClass = (key: InsightKey) =>
    [
      'rounded-xl border p-3 text-left transition-all',
      activeInsight === key
        ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200 shadow-sm'
        : 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/30',
    ].join(' ');

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Allocation Coverage</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {items.map((item, index) => {
          const key: InsightKey = index === 0 ? 'team' : index === 1 ? 'product' : 'owner';
          return (
            <button key={item.label} type="button" className={cardClass(key)} onClick={() => setActiveInsight((curr) => (curr === key ? null : key))}>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.label}</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(item.valuePct)}</p>
            <p
              className={[
                'mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                stateClass[item.state],
              ].join(' ')}
            >
              {item.state}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-slate-500">Click for insight</p>
            </button>
          );
        })}
        <button type="button" className={cardClass('unallocated')} onClick={() => setActiveInsight((curr) => (curr === 'unallocated' ? null : 'unallocated'))}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unallocated</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(coverage.unallocatedAmount)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-600">
            {formatPercent(coverage.unallocatedPct)} of scoped spend
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">Click for insight</p>
        </button>
      </div>

      <KpiInsightModal
        open={Boolean(activeInsight && insight)}
        title={insight?.title || ''}
        value={insight?.value || null}
        summary={insight?.summary || null}
        points={insight?.points || []}
        contextLabel={contextLabel}
        onClose={() => setActiveInsight(null)}
        maxWidthClass="max-w-lg"
      />
    </section>
  );
}
