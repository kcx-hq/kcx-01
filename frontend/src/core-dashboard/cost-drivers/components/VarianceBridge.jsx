import React from 'react';
import { formatCurrency } from '../utils/format';

export function VarianceBridge({ overallStats }) {
  if (!overallStats?.totalPrev) return null;

  const maxVal = Math.max(overallStats.totalPrev, overallStats.totalCurr) * 1.3;
  const getHeight = (val) => `${Math.max(4, (Math.abs(val) / maxVal) * 100)}%`;

  return (
    <div className="relative flex h-36 select-none items-end justify-between gap-2 rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-3 pb-2 md:h-40 md:gap-3 md:px-4">
      <div className="pointer-events-none absolute inset-0 border-b border-[var(--border-muted)]" />

      <div className="group relative flex w-1/4 flex-col items-center">
        <div style={{ height: getHeight(overallStats.totalPrev) }} className="relative flex w-full justify-center rounded-t-lg bg-slate-300 transition-opacity hover:opacity-100">
          <span className="absolute -top-7 rounded border border-[var(--border-light)] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-secondary)]">
            {formatCurrency(overallStats.totalPrev)}
          </span>
        </div>
        <span className="mt-2 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Start</span>
      </div>

      <div className="group relative flex w-1/4 flex-col items-center">
        <div style={{ height: getHeight(overallStats.totalIncreases) }} className="relative flex w-full justify-center rounded-t-lg border-t border-amber-400 bg-amber-100 transition-colors hover:bg-amber-200">
          <span className="absolute -top-7 rounded border border-amber-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
            +{formatCurrency(overallStats.totalIncreases)}
          </span>
        </div>
        <span className="mt-2 text-[9px] font-bold uppercase tracking-wider text-amber-700">Increases</span>
      </div>

      <div className="group relative flex w-1/4 flex-col items-center">
        <div style={{ height: getHeight(overallStats.totalDecreases) }} className="relative flex w-full justify-center rounded-t-lg border-t border-emerald-400 bg-emerald-100 transition-colors hover:bg-emerald-200">
          <span className="absolute -top-7 rounded border border-emerald-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-[var(--brand-primary)]">
            {formatCurrency(overallStats.totalDecreases)}
          </span>
        </div>
        <span className="mt-2 text-[9px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">Savings</span>
      </div>

      <div className="group relative flex w-1/4 flex-col items-center">
        <div style={{ height: getHeight(overallStats.totalCurr) }} className="relative flex w-full justify-center rounded-t-lg bg-[var(--brand-primary)] transition-all hover:brightness-110">
          <span className="absolute -top-7 rounded border border-emerald-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-[var(--brand-primary)]">
            {formatCurrency(overallStats.totalCurr)}
          </span>
        </div>
        <span className="mt-2 text-[9px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">End</span>
      </div>
    </div>
  );
}
