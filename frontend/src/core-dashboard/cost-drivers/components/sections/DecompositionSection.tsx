import React, { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../../utils/format';

const TAB_ORDER = ['service', 'account', 'region', 'team', 'sku'];
const TOP_SERVICE_LIMIT = 10;

const riskTone = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
};

const confidenceTone = {
  High: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-rose-100 text-rose-700 border-rose-200',
};

export default function DecompositionSection({
  decomposition,
  topDrivers = [],
  activeTab,
  onTabChange,
  onOpenDetail,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const tab = decomposition?.tabs?.[activeTab] || decomposition?.tabs?.service || { rows: [] };
  const rows = Array.isArray(tab.rows) ? tab.rows : [];
  const serviceRowsByKey = useMemo(() => {
    const map = new Map();
    for (const row of decomposition?.tabs?.service?.rows || []) {
      map.set(row.key, row);
      map.set(String(row.key || '').toLowerCase(), row);
      map.set(String(row.name || '').toLowerCase(), row);
    }
    return map;
  }, [decomposition]);

  const isServiceTab = activeTab === 'service';
  const mergedServiceRows = useMemo(() => {
    if (!isServiceTab) return rows;
    if (!Array.isArray(topDrivers) || !topDrivers.length) return rows.slice(0, TOP_SERVICE_LIMIT);

    return topDrivers.slice(0, TOP_SERVICE_LIMIT).map((driver) => {
      const base =
        serviceRowsByKey.get(driver.key) ||
        serviceRowsByKey.get(String(driver.key || '').toLowerCase()) ||
        serviceRowsByKey.get(String(driver.name || '').toLowerCase());
      if (base) {
        return {
          ...base,
          confidence: driver.confidence,
          evidenceSummary: driver.evidenceSummary,
        };
      }
      return {
        key: driver.key,
        name: driver.name,
        dimension: 'service',
        previousSpend: 0,
        currentSpend: 0,
        deltaValue: driver.deltaValue,
        deltaPercent: driver.deltaPercent,
        contributionPercent: driver.contributionPercent,
        contributionScore: Math.abs(driver.contributionPercent || 0),
        driverType: '-',
        riskLevel: driver.riskLevel || 'low',
        unexplainedContribution: 0,
        evidencePayload: driver.evidencePayload || { dimension: 'service', driverKey: driver.key },
        confidence: driver.confidence,
        evidenceSummary: driver.evidenceSummary,
      };
    });
  }, [isServiceTab, rows, topDrivers, serviceRowsByKey]);

  const viewRows = isServiceTab ? mergedServiceRows : rows;

  const serviceSummary = useMemo(() => {
    if (!isServiceTab || !mergedServiceRows.length) {
      return {
        increases: 0,
        decreases: 0,
        topIncrease: null,
        topDecrease: null,
      };
    }
    const increases = mergedServiceRows.filter((row) => Number(row.deltaValue || 0) > 0).length;
    const decreases = mergedServiceRows.filter((row) => Number(row.deltaValue || 0) < 0).length;
    const sorted = [...mergedServiceRows].sort((a, b) => Math.abs(Number(b.deltaValue || 0)) - Math.abs(Number(a.deltaValue || 0)));
    const topIncrease = sorted.find((row) => Number(row.deltaValue || 0) > 0) || null;
    const topDecrease = sorted.find((row) => Number(row.deltaValue || 0) < 0) || null;
    return { increases, decreases, topIncrease, topDecrease };
  }, [isServiceTab, mergedServiceRows]);

  const totalPages = Math.max(1, Math.ceil(viewRows.length / pageSize));
  const materiality = decomposition?.materiality || null;

  useEffect(() => {
    setPage(1);
  }, [activeTab, pageSize]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return viewRows.slice(start, start + pageSize);
  }, [viewRows, page, pageSize]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
          Drivers By Dimension
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

      {isServiceTab ? (
        <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Largest Increase</p>
            <p className="mt-1 text-xs font-black text-emerald-900">
              {serviceSummary.topIncrease?.name || 'N/A'}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-emerald-700">
              {serviceSummary.topIncrease
                ? `${serviceSummary.topIncrease.deltaValue >= 0 ? '+' : ''}${formatCurrency(serviceSummary.topIncrease.deltaValue)}`
                : '-'}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Largest Decrease</p>
            <p className="mt-1 text-xs font-black text-amber-900">
              {serviceSummary.topDecrease?.name || 'N/A'}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-amber-700">
              {serviceSummary.topDecrease
                ? `${serviceSummary.topDecrease.deltaValue >= 0 ? '+' : ''}${formatCurrency(serviceSummary.topDecrease.deltaValue)}`
                : '-'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Upward Drivers</p>
            <p className="mt-1 text-xs font-black text-slate-800">{serviceSummary.increases}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Downward Drivers</p>
            <p className="mt-1 text-xs font-black text-slate-800">{serviceSummary.decreases}</p>
          </div>
        </div>
      ) : null}

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
                <th className="px-3 py-2">{isServiceTab ? 'Evidence' : 'Driver Type'}</th>
                <th className="px-3 py-2 text-right">Contribution</th>
                <th className="px-3 py-2">{isServiceTab ? 'Confidence' : 'Risk'}</th>
                <th className="px-3 py-2 text-right">{isServiceTab ? 'View' : 'Evidence'}</th>
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
                    <td className="px-3 py-3 font-semibold text-slate-700">
                      {isServiceTab ? row.evidenceSummary || row.driverType || '-' : row.driverType}
                    </td>
                    <td className="px-3 py-3 text-right font-black text-slate-800">
                      {Number(row.contributionScore || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      {isServiceTab ? (
                        <span
                          className={[
                            'rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider',
                            confidenceTone[row.confidence] || confidenceTone.Low,
                          ].join(' ')}
                        >
                          {row.confidence || 'Low'}
                        </span>
                      ) : (
                        <span
                          className={[
                            'rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider',
                            riskTone[row.riskLevel || 'low'] || riskTone.low,
                          ].join(' ')}
                        >
                          {row.riskLevel || 'low'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenDetail({
                            ...row,
                            dimension: activeTab,
                            detailsPayload: row.detailsPayload || row.evidencePayload || {
                              dimension: activeTab,
                              driverKey: row.key,
                            },
                          })
                        }
                        className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 hover:bg-emerald-100"
                      >
                        View
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
