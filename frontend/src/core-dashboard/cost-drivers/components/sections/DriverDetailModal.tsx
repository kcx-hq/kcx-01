import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../../utils/format';

const Row = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
  </div>
);

export default function DriverDetailModal({
  open,
  driver,
  details,
  loading,
  onClose,
}) {
  if (!open || !driver) return null;

  const summary = details?.summary || null;
  const trend = Array.isArray(details?.trend) ? details.trend : [];
  const resources = Array.isArray(details?.resourceBreakdown) ? details.resourceBreakdown : [];
  const links = details?.links || {};

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Driver Detail</p>
            <h4 className="text-xl font-black text-slate-900">{driver.name || driver.key}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-black uppercase text-slate-600 hover:border-rose-200 hover:text-rose-700"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(92vh-68px)] space-y-4 overflow-y-auto p-4">
          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
              Loading evidence...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <Row label="Previous Spend" value={formatCurrency(summary?.previousSpend || 0)} />
                <Row label="Current Spend" value={formatCurrency(summary?.currentSpend || 0)} />
                <Row
                  label="Delta"
                  value={`${summary?.deltaValue >= 0 ? '+' : ''}${formatCurrency(summary?.deltaValue || 0)}`}
                />
                <Row label="Contribution" value={`${Number(summary?.contributionScore || 0).toFixed(2)}`} />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-600">Driver Trend</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value || 0))}
                        labelFormatter={(label) => String(label)}
                      />
                      <Line dataKey="currentSpend" stroke="#0f766e" strokeWidth={2} dot={false} />
                      <Line dataKey="previousSpend" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">Resource Evidence</p>
                  <div className="flex items-center gap-2">
                    {links?.billingExplorer ? (
                      <a
                        href={links.billingExplorer}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                      >
                        Billing Explorer
                      </a>
                    ) : null}
                    {links?.resourceExplorer ? (
                      <a
                        href={links.resourceExplorer}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                      >
                        Resource Explorer
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Resource</th>
                        <th className="px-3 py-2 text-right">Previous</th>
                        <th className="px-3 py-2 text-right">Current</th>
                        <th className="px-3 py-2 text-right">Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resources.length ? (
                        resources.map((item) => (
                          <tr key={`${item.resourceId}-${item.resourceName}`}>
                            <td className="px-3 py-2 font-semibold text-slate-700">{item.resourceName}</td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-500">
                              {formatCurrency(item.previousSpend)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-700">
                              {formatCurrency(item.currentSpend)}
                            </td>
                            <td
                              className={[
                                'px-3 py-2 text-right font-black',
                                item.deltaValue >= 0 ? 'text-amber-700' : 'text-emerald-700',
                              ].join(' ')}
                            >
                              {item.deltaValue >= 0 ? '+' : ''}
                              {formatCurrency(item.deltaValue)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                            No resource-level evidence for this driver.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
