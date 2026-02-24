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

const InsightCard = ({ label, value, hint, tone = 'slate' }) => {
  const toneClass =
    tone === 'good'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
        : tone === 'risk'
          ? 'border-rose-200 bg-rose-50'
          : 'border-slate-200 bg-slate-50';

  return (
    <article className={`rounded-xl border p-3 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-base font-black text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-[11px] font-semibold text-slate-600">{hint}</p> : null}
    </article>
  );
};

export default function WaterfallSection({ waterfall }) {
  const model = useMemo(() => {
    const startValue = Number(waterfall?.startValue || 0);
    const endValue = Number(waterfall?.endValue || 0);
    const steps = Array.isArray(waterfall?.steps) ? waterfall.steps : [];
    const netChange = endValue - startValue;

    const rows = [
      {
        id: 'previous_total',
        name: 'Previous',
        base: 0,
        size: startValue,
        signed: startValue,
        kind: 'total',
      },
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
        contributionPctNet: Number(step?.contributionPctNet || 0),
        contributionAbsPct: Number(step?.contributionAbsPct || 0),
        confidence: step?.confidence || null,
      });
      running += value;
    });

    rows.push({
      id: 'current_total',
      name: 'Current',
      base: 0,
      size: endValue,
      signed: endValue,
      kind: 'total',
    });

    const deltaSteps = rows.filter((row) => row.kind === 'delta');

    const explainedCore = deltaSteps.reduce((sum, row) => sum + row.signed, 0);

    return {
      rows,
      startValue,
      endValue,
      netChange,
      explainedCore,
      isBalanced: Boolean(waterfall?.validation?.isBalanced),
      validationGap: Number(waterfall?.validation?.deltaDifference || 0),
    };
  }, [waterfall]);

  const netTone = model.netChange >= 0 ? 'warn' : 'good';
  const netHint = model.netChange >= 0 ? 'Net increase vs baseline period.' : 'Net savings vs baseline period.';
  const tooltipFormatter = (_value, _name, item) => {
    const payload = item?.payload;
    if (!payload) return '';
    if (payload.kind === 'total') return formatCurrency(payload.signed);
    return `${payload.signed >= 0 ? '+' : ''}${formatCurrency(payload.signed)} | ${Number(payload.contributionAbsPct || 0).toFixed(2)}% abs`;
  };
  const tooltipLabelFormatter = (_label, payload) => {
    const point = Array.isArray(payload) && payload[0]?.payload ? payload[0].payload : null;
    if (!point || point.kind === 'total') return point?.name || '';
    const driverType = String(point.driverType || '').replaceAll('_', ' ');
    const confidence = String(point.confidence || '').toUpperCase();
    return `${point.name} (${driverType}${confidence ? ` | ${confidence}` : ''})`;
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Variance Waterfall</h3>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Reconciles spend movement from previous period to current period using classified cost drivers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={[
              'rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider',
              model.isBalanced ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-rose-200 bg-rose-100 text-rose-700',
            ].join(' ')}
          >
            {model.isBalanced ? 'Balanced' : 'Needs Review'}
          </span>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <InsightCard label="Previous Spend" value={formatCurrency(model.startValue)} hint="Baseline window total." />
        <InsightCard label="Current Spend" value={formatCurrency(model.endValue)} hint="Current analysis window total." />
        <InsightCard
          label="Net Movement"
          value={`${model.netChange >= 0 ? '+' : ''}${formatCurrency(model.netChange)}`}
          hint={netHint}
          tone={netTone}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={model.rows} margin={{ top: 10, right: 8, left: 0, bottom: 44 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dbe2ea" />
              <XAxis
                dataKey="name"
                angle={-20}
                textAnchor="end"
                height={64}
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }}
              />
              <YAxis tickFormatter={formatAxisCurrency} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabelFormatter}
              />
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

        <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Explained Core</p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {model.explainedCore >= 0 ? '+' : ''}
              {formatCurrency(model.explainedCore)}
            </p>
            <p className="text-xs font-semibold text-slate-600">
              Sum of classified drivers excluding residual bars.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Validation Gap</p>
            <p className="mt-1 text-sm font-black text-slate-900">{formatCurrency(model.validationGap)}</p>
            <p className="text-xs font-semibold text-slate-600">
              Target is 0.00 for exact reconciliation between start and end values.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
