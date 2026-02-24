import React from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../../utils/format';

const safeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const axisCurrency = (value) => {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Number(value || 0).toFixed(0)}`;
};

export default function VarianceTrendSection({ trendComparison }) {
  const series = Array.isArray(trendComparison?.series) ? trendComparison.series : [];
  const overlay = trendComparison?.residualOverlay || {
    alert: false,
    severity: 'low',
    unexplainedValue: 0,
    unexplainedPercentOfNet: 0,
    thresholdPercent: 5,
  };
  const windows = trendComparison?.windows || {
    current: { startDate: null, endDate: null, days: 0 },
    previous: { startDate: null, endDate: null, days: 0 },
  };

  return (
    <section className="relative z-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Variance Trend</h3>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Current vs previous period trend with explained and residual variance overlay.
          </p>
        </div>
        <span
          className={[
            'rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider',
            overlay.alert ? 'border-rose-200 bg-rose-100 text-rose-700' : 'border-emerald-200 bg-emerald-100 text-emerald-700',
          ].join(' ')}
        >
          {overlay.alert
            ? `Unexplained Alert ${Number(overlay.unexplainedPercentOfNet || 0).toFixed(2)}%`
            : 'Unexplained In Control'}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dbe2ea" />
              <XAxis dataKey="date" tickFormatter={safeDate} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tickFormatter={axisCurrency} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                labelFormatter={(label) => safeDate(label)}
                formatter={(value, name, payload) => {
                  if (!payload?.payload) return value;
                  const point = payload.payload;
                  if (name === 'driverTags') return null;
                  if (name === 'residualValue') {
                    return `${formatCurrency(Number(value || 0))} (${Number(point.residualAbsPctOfDelta || 0).toFixed(2)}% of daily delta)`;
                  }
                  return formatCurrency(Number(value || 0));
                }}
                contentStyle={{ borderRadius: '10px', borderColor: '#dbe2ea' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="residualValue"
                name="Residual (Unexplained)"
                stroke="#ef4444"
                fill="#fecaca"
                fillOpacity={0.35}
              />
              <Line type="monotone" dataKey="currentSpend" name="Current" stroke="#0f766e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="previousSpend" name="Previous" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="explainedValue" name="Explained Delta" stroke="#2563eb" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Window Alignment</p>
          <p className="mt-1 text-sm font-black text-slate-900">
            Current: {Number(windows?.current?.days || 0)} days | Previous: {Number(windows?.previous?.days || 0)} days
          </p>
          <p className="text-xs font-semibold text-slate-600">
            Trend compares aligned daily windows; unexplained controls are shown in the Unexplained Variance panel.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nearby Driver Tags</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {(series[series.length - 1]?.driverTags || []).slice(0, 3).join(' | ') || 'No dominant tags on latest point'}
          </p>
          <p className="text-xs font-semibold text-slate-600">
            Hover any point to inspect daily explained vs unexplained movement.
          </p>
        </div>
      </div>
    </section>
  );
}
