import React from 'react';

interface DenominatorGateBadgeProps {
  status?: 'pass' | 'warn' | 'fail' | string;
  reasons?: string[];
  metric?: string;
}

const toneByStatus: Record<string, string> = {
  pass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  fail: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function DenominatorGateBadge({
  status = 'fail',
  reasons = [],
  metric = 'consumed_quantity',
}: DenominatorGateBadgeProps) {
  const normalized = String(status || 'fail').toLowerCase();
  const tone = toneByStatus[normalized] || toneByStatus.fail;
  const label = normalized === 'pass' ? 'Pass' : normalized === 'warn' ? 'Warn' : 'Fail';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={['rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider', tone].join(' ')}>
        Denominator Gate: {label}
      </span>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
        Metric: {String(metric).replaceAll('_', ' ')}
      </span>
      {Array.isArray(reasons) && reasons.length ? (
        <p className="text-xs font-semibold text-slate-600">{reasons[0]}</p>
      ) : null}
    </div>
  );
}
