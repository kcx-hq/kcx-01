import React, { useMemo, useState } from 'react';
import type { AllocationOverviewModel } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';
import KpiInsightModal from '../shared/KpiInsightModal';

interface AllocationOverviewSectionProps {
  model: AllocationOverviewModel;
  contextLabel?: string;
}

const levelClass: Record<AllocationOverviewModel['allocationConfidence']['level'], string> = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-rose-200 bg-rose-50 text-rose-700',
};

type InsightKey =
  | 'total_cost'
  | 'allocated_pct'
  | 'unallocated_pct'
  | 'shared_pool'
  | 'allocation_method'
  | 'allocation_confidence';

export default function AllocationOverviewSection({ model, contextLabel }: AllocationOverviewSectionProps) {
  const [activeInsight, setActiveInsight] = useState<InsightKey | null>(null);

  const insight = useMemo(() => {
    if (!activeInsight) return null;

    if (activeInsight === 'total_cost') {
      return {
        title: 'Total Cloud Cost',
        value: formatCurrency(model.totalCloudCost),
        summary: 'Scoped baseline used for ownership, allocation coverage, and unit-cost computation.',
        points: [
          `Total scoped cloud cost: ${formatCurrency(model.totalCloudCost)}`,
          'Used as denominator for allocation and unallocated ratios.',
        ],
      };
    }

    if (activeInsight === 'allocated_pct') {
      return {
        title: 'Allocated %',
        value: formatPercent(model.allocatedPct),
        summary: 'Share of scoped spend successfully mapped to ownership dimensions.',
        points: [
          `Allocated coverage: ${formatPercent(model.allocatedPct)}`,
          model.allocatedPct >= 95
            ? 'Coverage is finance-ready for chargeback reporting.'
            : 'Coverage below finance-ready threshold; mapping quality should be improved.',
        ],
      };
    }

    if (activeInsight === 'unallocated_pct') {
      return {
        title: 'Unallocated %',
        value: formatPercent(model.unallocatedPct),
        summary: 'Portion of spend with incomplete mapping; this reduces attribution trust.',
        points: [
          `Unallocated ratio: ${formatPercent(model.unallocatedPct)}`,
          model.unallocatedPct <= 5
            ? 'Unallocated exposure is controlled.'
            : 'Unallocated exposure is material and can distort team accountability.',
        ],
      };
    }

    if (activeInsight === 'shared_pool') {
      return {
        title: 'Shared Cost Pool',
        value: formatCurrency(model.sharedCostPoolAmount),
        summary: 'Cost that requires redistribution logic before final ownership reporting.',
        points: [
          `Detected shared pool: ${formatCurrency(model.sharedCostPoolAmount)}`,
          'Shared pool must reconcile to redistributed amount for chargeback trust.',
        ],
      };
    }

    if (activeInsight === 'allocation_method') {
      return {
        title: 'Allocation Method',
        value: model.allocationMethod.replaceAll('_', ' '),
        summary: 'Rule used by the allocation engine to distribute shared pool costs.',
        points: [
          `Current method: ${model.allocationMethod.replaceAll('_', ' ')}`,
          'Method consistency is required for period-over-period comparability.',
        ],
      };
    }

    return {
      title: 'Allocation Confidence',
      value: `${formatPercent(model.allocationConfidence.score)} (${model.allocationConfidence.level})`,
      summary: 'Composite trust score for allocation quality and reporting reliability.',
      points: [
        `Tag coverage factor: ${formatPercent(model.allocationConfidence.factors.tagCoveragePct)}`,
        `Shared pool ratio factor: ${formatPercent(model.allocationConfidence.factors.sharedPoolRatioPct)}`,
        `Rule completeness factor: ${formatPercent(model.allocationConfidence.factors.ruleCompletenessPct)}`,
        `Data consistency factor: ${formatPercent(model.allocationConfidence.factors.dataConsistencyPct)}`,
      ],
    };
  }, [activeInsight, model]);

  const cardClass = (key: InsightKey) =>
    [
      'rounded-xl border p-3 text-left transition',
      activeInsight === key
        ? 'border-emerald-400 bg-emerald-50 shadow-[0_8px_30px_rgba(16,185,129,0.12)]'
        : 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-white',
    ].join(' ');

  const toggleInsight = (key: InsightKey) => {
    setActiveInsight((current) => (current === key ? null : key));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Allocation Overview</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <button type="button" className={cardClass('total_cost')} onClick={() => toggleInsight('total_cost')}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Cloud Cost</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(model.totalCloudCost)}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">Click for insight</p>
        </button>
        <button type="button" className={cardClass('allocated_pct')} onClick={() => toggleInsight('allocated_pct')}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Allocated %</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.allocatedPct)}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">Click for insight</p>
        </button>
        <button type="button" className={cardClass('unallocated_pct')} onClick={() => toggleInsight('unallocated_pct')}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unallocated %</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.unallocatedPct)}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">Click for insight</p>
        </button>
        <button type="button" className={cardClass('shared_pool')} onClick={() => toggleInsight('shared_pool')}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Shared Cost Pool</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(model.sharedCostPoolAmount)}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">Click for insight</p>
        </button>
        <button type="button" className={cardClass('allocation_method')} onClick={() => toggleInsight('allocation_method')}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Allocation Method</p>
          <p className="mt-1 text-sm font-black uppercase tracking-wider text-slate-800">
            {model.allocationMethod.replaceAll('_', ' ')}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">Click for insight</p>
        </button>
        <button
          type="button"
          className={cardClass('allocation_confidence')}
          onClick={() => toggleInsight('allocation_confidence')}
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Allocation Confidence</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.allocationConfidence.score)}</p>
          <p className={['mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider', levelClass[model.allocationConfidence.level]].join(' ')}>
            {model.allocationConfidence.level}
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
      />
    </section>
  );
}
