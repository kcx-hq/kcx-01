import React, { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../../utils/format';

const TAB_ORDER = ['service', 'account', 'region', 'team', 'sku'];

const riskTone = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
};

export default function DecompositionSection({
  decomposition,
  activeTab,
  onTabChange,
  onOpenDetail,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const tab = decomposition?.tabs?.[activeTab] || decomposition?.tabs?.service || { rows: [] };
  const rows = Array.isArray(tab.rows) ? tab.rows : [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const materiality = decomposition?.materiality || null;

  useEffect(() => {
    setPage(1);
  }, [activeTab, pageSize]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
          Driver Decomposition
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-slate-500">Rows</span>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"
          >
            {[8, 12, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Materiality Threshold</p>
          <p className="mt-1 text-xs font-black text-slate-800">${Number(materiality?.thresholdValue || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Omitted by Threshold</p>
          <p className="mt-1 text-xs font-black text-slate-800">{Number(tab?.omittedByThreshold || 0)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Omitted by Row Limit</p>
          <p className="mt-1 text-xs font-black text-slate-800">{Number(tab?.omittedByRowLimit || 0)}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {TAB_ORDER.map((tabKey) => {
          const tabData = decomposition?.tabs?.[tabKey];
          if (!tabData) return null;
          const selected = tabKey === activeTab;
          return (
            <button
              key={tabKey}
              type="button"
              onClick={() => onTabChange(tabKey)}
              className={[
                'rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider transition',
                selected
                  ? 'border-emerald-500 bg-emerald-100 text-emerald-700 shadow-sm'
                  : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-emerald-200',
              ].join(' ')}
            >
              {tabData.title}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3 py-2">Dimension</th>
                <th className="px-3 py-2 text-right">Previous</th>
                <th className="px-3 py-2 text-right">Current</th>
                <th className="px-3 py-2 text-right">Delta</th>
                <th className="px-3 py-2 text-right">Delta %</th>
                <th className="px-3 py-2">Driver Type</th>
                <th className="px-3 py-2 text-right">Contribution</th>
                <th className="px-3 py-2">Risk</th>
                <th className="px-3 py-2 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedRows.length ? (
                pagedRows.map((row) => (
                  <tr key={row.key} className="bg-white">
                    <td className="px-3 py-3 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-600">{formatCurrency(row.previousSpend)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-800">{formatCurrency(row.currentSpend)}</td>
                    <td
                      className={[
                        'px-3 py-3 text-right font-black',
                        row.deltaValue >= 0 ? 'text-amber-700' : 'text-emerald-700',
                      ].join(' ')}
                    >
                      {row.deltaValue >= 0 ? '+' : ''}
                      {formatCurrency(row.deltaValue)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-600">
                      {row?.deltaPercentDisplay || `${Number(row.deltaPercent || 0).toFixed(2)}%`}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-700">{row.driverType}</td>
                    <td className="px-3 py-3 text-right font-black text-slate-800">
                      {Number(row.contributionScore || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={[
                          'rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider',
                          riskTone[row.riskLevel || 'low'] || riskTone.low,
                        ].join(' ')}
                      >
                        {row.riskLevel || 'low'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenDetail({ ...row, dimension: activeTab })}
                        className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 hover:bg-emerald-100"
                      >
                        View Evidence
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                    No decomposition rows found for selected tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-600">
        <p>
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
