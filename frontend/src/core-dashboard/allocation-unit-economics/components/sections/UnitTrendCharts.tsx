import React, { useMemo } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { UnitTrendPoint } from '../../types';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';

interface UnitTrendChartsProps {
  trend: UnitTrendPoint[];
  targetUnitCost: number | null;
}

interface TrendTooltipItem {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: UnitTrendPoint;
}

interface TrendTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TrendTooltipItem[];
}

const classifyElasticity = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  if (value < 0) return 'Scale Advantage';
  if (value < 1) return 'Efficient';
  if (value <= 1.1) return 'Linear';
  return 'Degrading';
};

function CostVolumeTooltip({ active, label, payload }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">{formatDate(String(label || ''))}</p>
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <p key={`${entry.name}-${entry.color}`} className="text-xs font-semibold text-slate-700">
            <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: entry.color || '#64748b' }} />{' '}
            <span className="ml-1">{entry.name}: </span>
            {entry.name?.includes('Cost')
              ? formatCurrency(Number(entry.value || 0))
              : formatNumber(Number(entry.value || 0), 2)}
          </p>
        ))}
      </div>
      {point ? (
        <p className="mt-2 text-[11px] font-semibold text-slate-600">
          Unit Cost: <span className="font-black text-slate-800">{formatNumber(point.unitPrice, 6)}</span>
        </p>
      ) : null}
    </div>
  );
}

function UnitElasticityTooltip({ active, label, payload }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">{formatDate(String(label || ''))}</p>
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <p key={`${entry.name}-${entry.color}`} className="text-xs font-semibold text-slate-700">
            <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: entry.color || '#64748b' }} />{' '}
            <span className="ml-1">{entry.name}: </span>
            {entry.name?.includes('Elasticity')
              ? formatNumber(Number(entry.value || 0), 4)
              : formatNumber(Number(entry.value || 0), 6)}
          </p>
        ))}
      </div>
      {point ? (
        <p className="mt-2 text-[11px] font-semibold text-slate-600">
          Elasticity State:{' '}
          <span className="font-black text-slate-800">{classifyElasticity(point.elasticity)}</span>
        </p>
      ) : null}
    </div>
  );
}

export default function UnitTrendCharts({ trend, targetUnitCost }: UnitTrendChartsProps) {
  const changePointCount = useMemo(() => trend.filter((point) => point.isChangePoint).length, [trend]);
  const optimizationEventCount = useMemo(
    () => trend.filter((point) => point.isChangePoint && point.isOptimizationEvent).length,
    [trend],
  );

  const elasticityDomain = useMemo<[number, number]>(() => {
    const values = trend
      .map((point) => (Number.isFinite(point.elasticity ?? NaN) ? Number(point.elasticity) : 0))
      .filter((value) => Number.isFinite(value));
    if (!values.length) return [-1, 1];
    const maxAbs = Math.max(1, ...values.map((value) => Math.abs(value)));
    const bound = Number((maxAbs * 1.25).toFixed(2));
    return [-bound, bound];
  }, [trend]);

  if (!trend.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
        No trend points available for selected period.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700">
          {trend.length} points
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
          {changePointCount} change points
        </span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
          {optimizationEventCount} optimization markers
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Cost vs Volume</p>
          <p className="text-[10px] font-semibold text-slate-500">Left axis: Cost | Right axis: Volume</p>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend} syncId="allocation-unit-trend" margin={{ top: 8, right: 40, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe2ea" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis
                yAxisId="cost"
                width={84}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(Number(value || 0))}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                width={72}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(value) => formatNumber(Number(value || 0), 0)}
              />
              <Legend verticalAlign="top" height={26} />
              <Tooltip content={<CostVolumeTooltip />} />

              <Bar yAxisId="cost" dataKey="previousCost" name="Previous Cost" fill="#cbd5e1" barSize={10} />
              <Bar yAxisId="cost" dataKey="cost" name="Current Cost" fill="#0f766e" barSize={10} />
              <Line
                yAxisId="volume"
                type="monotone"
                dataKey="previousQuantity"
                name="Previous Volume"
                stroke="#94a3b8"
                strokeDasharray="5 4"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="volume"
                type="monotone"
                dataKey="quantity"
                name="Current Volume"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unit Cost & Elasticity</p>
          <p className="text-[10px] font-semibold text-slate-500">Left axis: Unit Cost | Right axis: Elasticity</p>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend} syncId="allocation-unit-trend" margin={{ top: 8, right: 40, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe2ea" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis
                yAxisId="unit"
                width={88}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(value) => formatNumber(Number(value || 0), 6)}
              />
              <YAxis
                yAxisId="elasticity"
                orientation="right"
                width={70}
                domain={elasticityDomain}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(value) => formatNumber(Number(value || 0), 2)}
              />
              <Legend verticalAlign="top" height={26} />
              <Tooltip content={<UnitElasticityTooltip />} />

              <Line
                yAxisId="unit"
                type="monotone"
                dataKey="previousUnitPrice"
                name="Previous Unit Cost"
                stroke="#f59e0b"
                strokeDasharray="5 4"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="unit"
                type="monotone"
                dataKey="unitPrice"
                name="Current Unit Cost"
                stroke="#111827"
                strokeWidth={3}
                dot={false}
              />
              <Area
                yAxisId="elasticity"
                type="monotone"
                dataKey="elasticity"
                name="Elasticity"
                stroke="#10b981"
                fill="#10b98133"
                strokeWidth={1.8}
                connectNulls
              />

              <ReferenceLine yAxisId="elasticity" y={0} stroke="#94a3b8" strokeDasharray="4 4" />

              {targetUnitCost !== null ? (
                <ReferenceLine
                  yAxisId="unit"
                  y={targetUnitCost}
                  stroke="#22c55e"
                  strokeDasharray="6 4"
                  label={{ value: 'Target Unit Cost', position: 'insideTopRight', fill: '#15803d', fontSize: 10 }}
                />
              ) : null}

              {trend
                .filter((point) => point.isChangePoint)
                .map((point) => (
                  <ReferenceDot
                    key={`cp-${point.date}`}
                    yAxisId="unit"
                    x={point.date}
                    y={point.unitPrice}
                    r={4}
                    fill={point.isOptimizationEvent ? '#10b981' : '#f97316'}
                    stroke="#ffffff"
                  />
                ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
