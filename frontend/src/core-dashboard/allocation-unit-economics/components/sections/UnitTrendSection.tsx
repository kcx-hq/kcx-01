import React from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { UnitEconomicsModel } from '../../types';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../../utils/format';

interface UnitTrendSectionProps {
  model: UnitEconomicsModel;
}

export default function UnitTrendSection({ model }: UnitTrendSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Unit Economics & Trend</h3>

      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Cost</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(model.totalCost)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Volume</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatNumber(model.totalQuantity)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Avg Unit Cost</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatNumber(model.avgUnitPrice, 6)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unit Cost Change</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.unitPriceChangePct)}</p>
        </article>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={model.trend} margin={{ top: 10, right: 8, left: 0, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe2ea" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis yAxisId="cost" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis yAxisId="qty" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                labelFormatter={(value) => formatDate(String(value))}
                formatter={(value, name) => {
                  if (name === 'quantity') return formatNumber(Number(value || 0), 2);
                  if (name === 'unitPrice') return formatNumber(Number(value || 0), 6);
                  return formatCurrency(Number(value || 0));
                }}
              />
              <Bar yAxisId="qty" dataKey="quantity" fill="#c7d2fe" name="quantity" />
              <Line yAxisId="cost" dataKey="cost" stroke="#0f766e" strokeWidth={2} dot={false} name="cost" />
              <Line yAxisId="cost" dataKey="unitPrice" stroke="#f59e0b" strokeWidth={2} dot={false} name="unitPrice" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Efficiency Insight</p>
        <p className="mt-1 text-sm font-black text-slate-900">{model.efficiencyInsight}</p>
        <p className="mt-1 text-xs font-semibold text-slate-600">
          Cost growth: {formatPercent(model.costGrowthPct)} | Volume growth: {formatPercent(model.volumeGrowthPct)}
        </p>
      </div>
    </section>
  );
}
