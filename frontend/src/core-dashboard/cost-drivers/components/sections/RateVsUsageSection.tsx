import React, { useMemo, useState } from 'react';
import { formatCurrency } from '../../utils/format';

const toShare = (value, total) => {
  const base = Math.abs(Number(total || 0));
  if (!base) return 0;
  return (Number(value || 0) / base) * 100;
};

const confidenceTone = {
  High: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-rose-100 text-rose-700 border-rose-200',
};

export default function RateVsUsageSection({ rateVsUsage, onOpenDetail }) {
  const [mode, setMode] = useState<'absolute' | 'share'>('absolute');
  const model = rateVsUsage || {
    supported: false,
    supportReason: 'No decomposition signal available.',
    coveragePercent: 0,
    summary: {
      usageEffectValue: 0,
      rateEffectValue: 0,
      interactionValue: 0,
      totalExplainedFromSplit: 0,
    },
    interpretation: 'No decomposition signal available.',
    rows: [],
  };

  const rows = Array.isArray(model.rows) ? model.rows.slice(0, 10) : [];
  const totalAbs = useMemo(
    () =>
      rows.reduce(
        (sum, row) =>
          sum +
          Math.abs(Number(row.usageEffectValue || 0)) +
          Math.abs(Number(row.rateEffectValue || 0)) +
          Math.abs(Number(row.interactionValue || 0)),
        0,
      ),
    [rows],
  );

  if (!model.supported) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Rate vs Usage Split</h3>
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
          <p className="text-xs font-black uppercase tracking-wider text-amber-700">Not available</p>
          <p className="mt-1 text-sm font-semibold text-amber-800">{model.supportReason}</p>
          <p className="mt-2 text-xs font-semibold text-amber-700">
            Coverage: {Number(model.coveragePercent || 0).toFixed(2)}%
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Rate vs Usage Split</h3>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Separates variance impact from consumption movement vs effective pricing movement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('absolute')}
            className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
              mode === 'absolute'
                ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            $
          </button>
          <button
            type="button"
            onClick={() => setMode('share')}
            className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
              mode === 'share'
                ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            %
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Usage Effect</p>
          <p className={`mt-1 text-base font-black ${model.summary.usageEffectValue >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {model.summary.usageEffectValue >= 0 ? '+' : ''}
            {formatCurrency(model.summary.usageEffectValue)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rate Effect</p>
          <p className={`mt-1 text-base font-black ${model.summary.rateEffectValue >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {model.summary.rateEffectValue >= 0 ? '+' : ''}
            {formatCurrency(model.summary.rateEffectValue)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Interaction</p>
          <p className={`mt-1 text-base font-black ${model.summary.interactionValue >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {model.summary.interactionValue >= 0 ? '+' : ''}
            {formatCurrency(model.summary.interactionValue)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Coverage</p>
          <p className="mt-1 text-base font-black text-slate-800">{Number(model.coveragePercent || 0).toFixed(2)}%</p>
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold text-slate-600">{model.interpretation}</p>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2 text-right">Usage</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Interaction</th>
                <th className="px-3 py-2 text-right">Total Delta</th>
                <th className="px-3 py-2">Confidence</th>
                <th className="px-3 py-2">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.key}>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => onOpenDetail({ key: row.key, name: row.name, dimension: 'service' })}
                        className="font-black text-slate-800 hover:text-emerald-700"
                      >
                        {row.name}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-700">
                      {mode === 'absolute'
                        ? `${row.usageEffectValue >= 0 ? '+' : ''}${formatCurrency(row.usageEffectValue)}`
                        : `${toShare(row.usageEffectValue, totalAbs).toFixed(2)}%`}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-700">
                      {mode === 'absolute'
                        ? `${row.rateEffectValue >= 0 ? '+' : ''}${formatCurrency(row.rateEffectValue)}`
                        : `${toShare(row.rateEffectValue, totalAbs).toFixed(2)}%`}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-700">
                      {mode === 'absolute'
                        ? `${row.interactionValue >= 0 ? '+' : ''}${formatCurrency(row.interactionValue)}`
                        : `${toShare(row.interactionValue, totalAbs).toFixed(2)}%`}
                    </td>
                    <td className={`px-3 py-3 text-right font-black ${row.totalDeltaValue >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {row.totalDeltaValue >= 0 ? '+' : ''}
                      {formatCurrency(row.totalDeltaValue)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={[
                          'rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider',
                          confidenceTone[row.confidence] || confidenceTone.Low,
                        ].join(' ')}
                      >
                        {row.confidence}
                      </span>
                    </td>
                    <td className="max-w-[320px] px-3 py-3 text-xs font-semibold text-slate-700">{row.evidenceSummary}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                    No rate-vs-usage rows for the selected scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

