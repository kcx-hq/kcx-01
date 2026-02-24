import React from 'react';
import type { ExportRow } from '../../types';

interface ExportSectionProps {
  rows: ExportRow[];
}

const toCsv = (rows: ExportRow[]): string => {
  const headers = [
    'Team',
    'Product',
    'Environment',
    'Direct Cost',
    'Shared Cost',
    'Total Cost',
    'Period',
    'Cost Basis',
    'Allocation Rule Used',
  ];

  const values = rows.map((row) => [
    row.team,
    row.product,
    row.environment,
    row.directCost.toFixed(2),
    row.sharedCost.toFixed(2),
    row.totalCost.toFixed(2),
    row.period,
    row.costBasis,
    row.allocationRuleUsed,
  ]);

  return [headers, ...values].map((line) => line.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(',')).join('\n');
};

export default function ExportSection({ rows }: ExportSectionProps) {
  const onExport = () => {
    if (!rows.length) return;
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `allocation-chargeback-export-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Finance Export</h3>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Export chargeback-ready rows with allocation rule and cost basis metadata.
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={!rows.length}
          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-emerald-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
        >
          Export Chargeback CSV
        </button>
      </div>
    </section>
  );
}
