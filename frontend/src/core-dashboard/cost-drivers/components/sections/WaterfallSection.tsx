import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../../utils/format';

const RESIDUAL_IDS = new Set(['unexplainedVariance', 'roundingResidual']);

const formatAxisCurrency = (value) => {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Number(value || 0).toFixed(0)}`;
};

export default function WaterfallSection({ waterfall }) {
  const model = useMemo(() => {
    const startValue = Number(waterfall?.startValue || 0);
    const endValue = Number(waterfall?.endValue || 0);
    const steps = Array.isArray(waterfall?.steps) ? waterfall.steps : [];
    const netChange = endValue - startValue;

    const rows = [
      { id: 'previous_total', name: 'Previous', base: 0, size: startValue, signed: startValue, kind: 'total' },
    ];

    let running = startValue;
    steps.forEach((step) => {
      const value = Number(step?.value || 0);
      const base = value >= 0 ? running : running + value;
      rows.push({
        id: step?.id || step?.label || 'delta',
        name: step?.label || 'Driver',
        base,
        size: Math.abs(value),
        signed: value,
        kind: RESIDUAL_IDS.has(step?.id) ? 'residual' : 'delta',
        driverType: step?.driverType || 'other',
        contributionAbsPct: Number(step?.contributionAbsPct || 0),
        confidence: String(step?.confidence || 'low').toUpperCase(),
      });
      running += value;
    });

    rows.push({ id: 'current_total', name: 'Current', base: 0, size: endValue, signed: endValue, kind: 'total' });

    const coreRows = rows
      .filter((row) => row.kind === 'delta')
      .sort((a, b) => Math.abs(b.signed) - Math.abs(a.signed));

    const positiveImpact = coreRows.filter((row) => row.signed > 0).reduce((sum, row) => sum + row.signed, 0);
    const savingsImpact = coreRows.filter((row) => row.signed < 0).reduce((sum, row) => sum + Math.abs(row.signed), 0);
    const grossChurn = positiveImpact + savingsImpact;
    const nettingRatio = grossChurn > 0 ? (Math.abs(netChange) / grossChurn) * 100 : 0;

    const largestIncrease = coreRows.find((row) => row.signed > 0) || null;
    const largestDecrease = coreRows.find((row) => row.signed < 0) || null;
    const residualValue = rows.filter((row) => row.kind === 'residual').reduce((sum, row) => sum + row.signed, 0);
    const residualShare = Math.abs(netChange) > 0 ? (Math.abs(residualValue) / Math.abs(netChange)) * 100 : 0;

    return {
      rows,
      positiveImpact,
      savingsImpact,
      grossChurn,
      nettingRatio,
      largestIncrease,
      largestDecrease,
      residualValue,
      residualShare,
      isBalanced: Boolean(waterfall?.validation?.isBalanced),
      validationGap: Number(waterfall?.validation?.deltaDifference || 0),
    };
  }, [waterfall]);

  const tooltipFormatter = (_value, _name, item) => {
    const payload = item?.payload;
    if (!payload) return '';
    if (payload.kind === 'total') return formatCurrency(payload.signed);
    return `${payload.signed >= 0 ? '+' : ''}${formatCurrency(payload.signed)} | ${Number(payload.contributionAbsPct || 0).toFixed(2)}% abs`;
  };

  const tooltipLabelFormatter = (_label, payload) => {
    const point = Array.isArray(payload) && payload[0]?.payload ? payload[0].payload : null;
    if (!point) return '';
    if (point.kind === 'total') return point.name;
    const driverType = String(point.driverType || '').replaceAll('_', ' ');
    return `${point.name} (${driverType}${point.confidence ? ` | ${point.confidence}` : ''})`;
  };

  const residualTone =
    model.residualShare >= 10
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : model.residualShare >= 5
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Variance Waterfall Bridge</h3>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Driver bridge with non-duplicate insights focused on concentration, offset pressure, and model trust.
          </p>
        </div>
        <span
          className={[
            'rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider',
            model.isBalanced ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-rose-200 bg-rose-100 text-rose-700',
          ].join(' ')}
        >
          {model.isBalanced ? 'Reconciled' : 'Needs Review'}
        </span>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Gross Driver Churn</p>
          <p className="mt-1 text-sm font-black text-slate-900">{formatCurrency(model.grossChurn)}</p>
          <p className="text-[11px] font-semibold text-slate-600">Total movement before offsets.</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Increase Pressure</p>
          <p className="mt-1 text-sm font-black text-amber-900">+{formatCurrency(model.positiveImpact)}</p>
          <p className="text-[11px] font-semibold text-amber-700">Total upward driver impact.</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Savings Pressure</p>
          <p className="mt-1 text-sm font-black text-emerald-900">-{formatCurrency(model.savingsImpact)}</p>
          <p className="text-[11px] font-semibold text-emerald-700">Total offsetting reductions.</p>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${residualTone}`}>
          <p className="text-[10px] font-black uppercase tracking-wider">Residual Share</p>
          <p className="mt-1 text-sm font-black">{model.residualShare.toFixed(1)}%</p>
          <p className="text-[11px] font-semibold">Unexplained + rounding vs net change.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={model.rows} margin={{ top: 8, right: 8, left: 0, bottom: 44 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dbe2ea" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" height={64} tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }} />
              <YAxis tickFormatter={formatAxisCurrency} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip formatter={tooltipFormatter} labelFormatter={tooltipLabelFormatter} />
              <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="size" stackId="wf" radius={[5, 5, 0, 0]}>
                {model.rows.map((entry, index) => {
                  let fill = '#94a3b8';
                  if (entry.kind === 'total') fill = '#0f766e';
                  if (entry.kind === 'residual') fill = '#ef4444';
                  if (entry.kind === 'delta') fill = entry.signed >= 0 ? '#f59e0b' : '#10b981';
                  return <Cell key={`${entry.id}-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Largest Increase Driver</p>
            <p className="mt-1 text-sm font-black text-amber-700">{model.largestIncrease?.name || 'N/A'}</p>
            <p className="text-xs font-semibold text-slate-600">
              {model.largestIncrease ? `+${formatCurrency(model.largestIncrease.signed)}` : '-'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Largest Decrease Driver</p>
            <p className="mt-1 text-sm font-black text-emerald-700">{model.largestDecrease?.name || 'N/A'}</p>
            <p className="text-xs font-semibold text-slate-600">
              {model.largestDecrease ? formatCurrency(model.largestDecrease.signed) : '-'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Netting Efficiency</p>
            <p className="mt-1 text-sm font-black text-slate-900">{model.nettingRatio.toFixed(1)}%</p>
            <p className="text-xs font-semibold text-slate-600">
              Lower values indicate strong internal offsets between drivers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
