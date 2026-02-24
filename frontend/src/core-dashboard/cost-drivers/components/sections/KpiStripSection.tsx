import React from 'react';
import { formatCurrency } from '../../utils/format';

const formatKpiValue = (card) => {
  if (card?.valueType === 'percent') return `${Number(card.value || 0).toFixed(2)}%`;
  if (card?.valueType === 'currency_with_percent') {
    return `${formatCurrency(card.value || 0)} (${Number(card.secondaryValue || 0).toFixed(2)}%)`;
  }
  return formatCurrency(card?.value || 0);
};

const formatDateLabel = (value) => {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatPeriodText = (text) => {
  if (!text || typeof text !== 'string') return text;
  const parts = text.split(' to ').map((token) => token.trim());
  if (parts.length === 2) {
    return `${formatDateLabel(parts[0]) || parts[0]} to ${formatDateLabel(parts[1]) || parts[1]}`;
  }
  return formatDateLabel(text) || text;
};

export default function KpiStripSection({
  cards = [],
  activeKpiId,
  onToggleKpi,
}) {
  if (!cards.length) return null;

  const active = cards.find((card) => card.id === activeKpiId) || null;
  const activePoints = Array.isArray(active?.insight?.points)
    ? [...new Set(active.insight.points.filter(Boolean))]
    : [];
  const activeTopContributors = Array.isArray(active?.insight?.topContributors)
    ? active.insight.topContributors.filter(
        (item, index, arr) =>
          arr.findIndex((candidate) => String(candidate?.name || '').toLowerCase() === String(item?.name || '').toLowerCase()) === index,
      )
    : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const isActive = activeKpiId === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onToggleKpi(card.id)}
              className={[
                'rounded-xl border px-3 py-3 text-left transition',
                isActive
                  ? 'border-emerald-400 bg-emerald-50 shadow-[0_8px_30px_rgba(16,185,129,0.12)]'
                  : 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-white',
              ].join(' ')}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
              <p className="mt-2 text-lg font-black text-slate-900">{formatKpiValue(card)}</p>
            </button>
          );
        })}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-white/65 p-4 backdrop-blur-[1px]"
          onClick={() => onToggleKpi(active.id)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{active.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {active?.insight?.summary || active.tooltip}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleKpi(active.id)}
                className="rounded-md border border-emerald-200 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700 hover:bg-emerald-50"
              >
                Close
              </button>
            </div>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Value</p>
              <p className="mt-1 text-lg font-black text-slate-900">{formatKpiValue(active)}</p>
            </div>

            {active?.insight?.title ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Insight</p>
                <p className="mt-1 text-sm font-black text-slate-800">{active.insight.title}</p>
              </div>
            ) : null}

            {activePoints.length ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Details</p>
                <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-700">
                  {activePoints.map((point) => (
                    <li key={point}>- {formatPeriodText(point)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {activeTopContributors.length ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Top Contributors</p>
                <div className="mt-2 space-y-2">
                  {activeTopContributors.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1"
                    >
                      <p className="truncate text-xs font-black text-slate-800">
                        {index + 1}. {item.name}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600">
                        {formatCurrency(item.deltaValue)} | {Number(item.contributionScore || 0).toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
