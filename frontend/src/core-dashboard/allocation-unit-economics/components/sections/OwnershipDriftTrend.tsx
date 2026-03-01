import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AllocationUnitEconomicsViewModel } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';

interface OwnershipDriftTrendProps {
  model: AllocationUnitEconomicsViewModel['ownershipDrift'];
}

export default function OwnershipDriftTrend({ model }: OwnershipDriftTrendProps) {
  const series = Array.isArray(model?.series) ? model.series : [];
  const flags = Array.isArray(model?.flags) ? model.flags : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Ownership Drift</h3>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Drift Events Over Time</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dbe2ea" />
                <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  formatter={(value, key) =>
                    key === 'impactedCost'
                      ? formatCurrency(Number(value || 0))
                      : key === 'driftRatePct'
                        ? formatPercent(Number(value || 0))
                        : String(value)
                  }
                />
                <Bar dataKey="driftEvents" name="Drift Events" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Integrity Flags</p>
          <div className="space-y-2">
            {flags.length ? (
              flags.slice(0, 10).map((flag) => (
                <div key={`${flag.team}-${flag.type}-${flag.detail}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-xs font-black text-slate-800">{flag.team}</p>
                  <p className="text-[11px] font-semibold text-slate-600">{flag.detail}</p>
                </div>
              ))
            ) : (
              <p className="text-sm font-semibold text-slate-500">No ownership drift integrity flags in this window.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
