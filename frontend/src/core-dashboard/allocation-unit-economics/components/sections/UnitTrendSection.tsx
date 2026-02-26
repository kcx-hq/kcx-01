import React, { useMemo } from 'react';
import type { UnitEconomicsModel } from '../../types';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/format';
import UnitTrendCharts from './UnitTrendCharts';

interface UnitTrendSectionProps {
  model: UnitEconomicsModel;
}

const statusClass: Record<UnitEconomicsModel['status'], string> = {
  improving: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  degrading: 'border-rose-200 bg-rose-50 text-rose-700',
  stable: 'border-slate-200 bg-slate-50 text-slate-700',
  volatile: 'border-amber-200 bg-amber-50 text-amber-700',
  insufficient_data: 'border-slate-200 bg-slate-50 text-slate-600',
};

const elasticityText: Record<UnitEconomicsModel['elasticityClass'], string> = {
  scale_advantage: 'Negative (scale advantage)',
  efficient: 'Efficient (<1)',
  linear: 'Linear (~1)',
  inefficient: 'Inefficient (>1)',
  undefined: 'Undefined',
};

export default function UnitTrendSection({ model }: UnitTrendSectionProps) {
  const decompositionTop = useMemo(
    () =>
      [...model.decomposition.components]
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 5),
    [model.decomposition.components],
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Unit Economics & Trend</h3>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
          {model.comparisonLabel}
        </span>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unit Cost</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatNumber(model.avgUnitPrice, 6)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">{formatPercent(model.unitPriceChangePct)} vs compare</p>
          <p className={['mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider', statusClass[model.status]].join(' ')}>
            {model.status.replaceAll('_', ' ')}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Elasticity Score</p>
          <p className="mt-1 text-xl font-black text-slate-900">
            {model.elasticityScore === null ? 'N/A' : formatNumber(model.elasticityScore, 4)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-600">{elasticityText[model.elasticityClass]}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            confidence: {model.elasticityConfidence}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Volume Growth</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.volumeGrowthPct)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            {formatNumber(model.previousTotalQuantity)}
            {' -> '}
            {formatNumber(model.totalQuantity)}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Infra Growth</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.costGrowthPct)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            {formatCurrency(model.previousTotalCost)}
            {' -> '}
            {formatCurrency(model.totalCost)}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unit Volatility</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.volatilityPct)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600 uppercase tracking-wider">{model.volatilityState} risk</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Forecast Unit Cost</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatNumber(model.forecast.projectedUnitCost, 6)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Band {formatNumber(model.forecast.lowerUnitCost, 6)} - {formatNumber(model.forecast.upperUnitCost, 6)}
          </p>
        </article>
      </div>

      <UnitTrendCharts trend={model.trend} targetUnitCost={model.target.targetUnitCost} />

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unit Cost Decomposition</p>
            <p className="text-[10px] font-bold text-slate-500">
              {formatNumber(model.decomposition.startUnitCost, 6)}
              {' -> '}
              {formatNumber(model.decomposition.endUnitCost, 6)}
            </p>
          </div>
          <div className="space-y-2">
            {decompositionTop.map((component) => (
              <div key={component.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span>{component.label}</span>
                  <span>{component.value >= 0 ? '+' : ''}{formatNumber(component.value, 6)}</span>
                </div>
                <div className="mt-1 text-[11px] font-semibold text-slate-500">
                  Contribution: {formatPercent(component.contributionPct)}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">
            Validation gap: {formatNumber(model.decomposition.validationDelta, 6)}
          </p>
        </div>

        <div className="space-y-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Efficiency Insight</p>
            <p className="mt-1 text-sm font-black text-slate-900">{model.insightPanel.summary}</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">{model.insightPanel.rootCause}</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Cost growth: {formatPercent(model.costGrowthPct)} | Volume growth: {formatPercent(model.volumeGrowthPct)}
            </p>
            {model.insightPanel.riskFlags.length ? (
              <div className="mt-2 space-y-1">
                {model.insightPanel.riskFlags.map((flag) => (
                  <p key={flag} className="text-[11px] font-semibold text-rose-600">- {flag}</p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[11px] font-semibold text-emerald-700">No immediate risk flags detected.</p>
            )}
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Forecast & Target</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Forecast cost: {formatCurrency(model.forecast.projectedCost)} | Forecast volume: {formatNumber(model.forecast.projectedVolume)}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Target unit: {model.target.targetUnitCost === null ? 'N/A' : formatNumber(model.target.targetUnitCost, 6)}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Gap: {model.target.gapValue === null ? 'N/A' : formatNumber(model.target.gapValue, 6)} ({formatPercent(model.target.gapPct)})
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Implied volume at target: {model.target.impliedVolumeAtCurrentCost === null ? 'N/A' : formatNumber(model.target.impliedVolumeAtCurrentCost)}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
