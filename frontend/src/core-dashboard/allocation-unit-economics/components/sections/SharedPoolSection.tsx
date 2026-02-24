import React from 'react';
import type { SharedPoolModel } from '../../types';
import { formatCurrency } from '../../utils/format';

interface SharedPoolSectionProps {
  model: SharedPoolModel;
}

export default function SharedPoolSection({ model }: SharedPoolSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Shared Cost Reallocation</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Shared Pool Total</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(model.total)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Rule Applied</p>
          <p className="mt-1 text-sm font-black text-slate-900">{model.ruleApplied}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Redistributed</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(model.redistributedAmount)}</p>
        </article>
      </div>

      <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Before/After (Top Teams)</p>
        {model.rows.slice(0, 6).map((row) => (
          <div key={row.team} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{row.team}</span>
              <span>{formatCurrency(row.totalCost)}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded bg-slate-100">
              <div
                className="h-full bg-emerald-400"
                style={{
                  width: `${Math.min(100, Math.max(0, row.pctOfTotal))}%`,
                }}
              />
            </div>
          </div>
        ))}
        {!model.rows.length ? (
          <p className="text-sm font-semibold text-slate-500">No redistribution rows available.</p>
        ) : null}
      </div>
    </section>
  );
}
