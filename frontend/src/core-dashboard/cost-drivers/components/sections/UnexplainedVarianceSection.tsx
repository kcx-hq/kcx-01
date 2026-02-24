import React from 'react';
import { formatCurrency } from '../../utils/format';

const tone = {
  high: 'border-rose-200 bg-rose-50 text-rose-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const confidenceTone = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-rose-200 bg-rose-50 text-rose-700',
};

const safeDateText = (value) => {
  if (!value) return 'N/A';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function UnexplainedVarianceSection({
  unexplainedVariance,
  attributionConfidence,
  runMeta,
  trust,
}) {
  const severity = unexplainedVariance?.severity || 'low';
  const confidenceLevel = attributionConfidence?.level || 'low';
  const confidenceRules = Array.isArray(attributionConfidence?.rules)
    ? attributionConfidence.rules
    : [];
  const warnings = Array.isArray(unexplainedVariance?.governanceWarnings)
    ? unexplainedVariance.governanceWarnings
    : [];

  return (
    <section className="relative z-0 h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Unexplained Variance</h3>
        <span
          className={[
            'rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider',
            tone[severity] || tone.low,
          ].join(' ')}
        >
          {severity}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unexplained Value</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(unexplainedVariance?.value || 0)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">% Of Net Change</p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {Number(unexplainedVariance?.percentOfNetChange || 0).toFixed(2)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Trust Risk</p>
          <p className="mt-2 text-2xl font-black text-slate-900 uppercase">{trust?.riskLevel || 'low'}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Model Residual</p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {formatCurrency(unexplainedVariance?.modelResidualValue || 0)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            Residual left after classifying all known variance drivers.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rounding Residual</p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {formatCurrency(unexplainedVariance?.roundingResidualValue || 0)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            Precision gap from rounded component aggregation.
          </p>
        </div>
      </div>

      <div
        className={[
          'mt-3 rounded-xl border p-3',
          confidenceTone[confidenceLevel] || confidenceTone.low,
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider">Attribution Confidence</p>
          <p className="text-xs font-black uppercase">
            {confidenceLevel} ({Number(attributionConfidence?.score || 0).toFixed(0)}/100)
          </p>
        </div>
        {confidenceRules.length ? (
          <ul className="mt-2 space-y-1 text-xs font-semibold">
            {confidenceRules.slice(0, 4).map((rule) => (
              <li key={rule.id} className="flex items-start justify-between gap-2">
                <span>{rule.label}</span>
                <span className="uppercase">{rule.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs font-semibold">No confidence rules available.</p>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Governance Warnings</p>
        {warnings.length ? (
          <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-700">
            {warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm font-semibold text-emerald-700">No trust blockers detected.</p>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Audit Metadata</p>
        <div className="mt-2 grid grid-cols-1 gap-2 text-xs font-semibold text-slate-700 md:grid-cols-2">
          <p>
            Run ID:{' '}
            <span className="break-all font-black text-slate-900">{runMeta?.runId || 'N/A'}</span>
          </p>
          <p>
            Engine: <span className="font-black text-slate-900">{runMeta?.engineVersion || 'N/A'}</span>
          </p>
          <p>
            Generated: <span className="font-black text-slate-900">{safeDateText(runMeta?.generatedAt)}</span>
          </p>
          <p>
            Source Rows: <span className="font-black text-slate-900">{Number(runMeta?.rawRowCount || 0)}</span>
          </p>
          <p>
            Scoped Rows: <span className="font-black text-slate-900">{Number(runMeta?.scopedRowCount || 0)}</span>
          </p>
          <p>
            Rows In Window: <span className="font-black text-slate-900">{Number(runMeta?.rowsInWindow || 0)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
