import React from 'react';
import type { AllocationUnitEconomicsControls } from '../../types';

interface GlobalControlsSectionProps {
  controls: AllocationUnitEconomicsControls;
  onChange: (patch: Partial<AllocationUnitEconomicsControls>) => void;
}

const labelMap = {
  period: 'Period',
  basis: 'Cost Basis',
  compareTo: 'Compare To',
  unitMetric: 'Unit Metric',
};

const options = {
  period: [
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'month', label: 'Month to Date' },
  ],
  basis: [
    { value: 'actual', label: 'Actual' },
    { value: 'amortized', label: 'Amortized' },
    { value: 'net', label: 'Net' },
  ],
  compareTo: [
    { value: 'previous_period', label: 'Previous Period' },
    { value: 'same_period_last_month', label: 'Same Period Last Month' },
  ],
  unitMetric: [
    { value: 'consumed_quantity', label: 'Consumed Quantity' },
    { value: 'requests', label: 'Requests' },
    { value: 'orders', label: 'Orders' },
    { value: 'gb', label: 'GB Processed' },
    { value: 'minutes', label: 'Minutes' },
  ],
};

export default function GlobalControlsSection({
  controls,
  onChange,
}: GlobalControlsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
          Allocation & Unit Economics Controls
        </h3>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
          Finance Scope
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(labelMap) as Array<keyof typeof labelMap>).map((key) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              {labelMap[key]}
            </span>
            <select
              value={controls[key]}
              onChange={(event) =>
                onChange({
                  [key]: event.target.value,
                } as Partial<AllocationUnitEconomicsControls>)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              {options[key].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}
