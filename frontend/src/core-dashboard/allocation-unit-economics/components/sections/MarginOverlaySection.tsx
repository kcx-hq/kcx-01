import React from 'react';
import type { MarginModel } from '../../types';
import { formatNumber, formatPercent } from '../../utils/format';

interface MarginOverlaySectionProps {
  model: MarginModel;
}

export default function MarginOverlaySection({ model }: MarginOverlaySectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Margin Overlay</h3>
      {!model.available ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm font-semibold text-slate-500">
          Revenue metrics unavailable in current scope; margin overlay is disabled.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Revenue / Unit</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatNumber(model.revenuePerUnit || 0, 6)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Cost / Unit</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatNumber(model.costPerUnit || 0, 6)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Margin / Unit</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatNumber(model.marginPerUnit || 0, 6)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Margin Trend</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(model.marginTrendPct)}</p>
          </article>
        </div>
      )}
    </section>
  );
}

