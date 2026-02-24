import React from 'react';

const SelectField = ({ label, value, onChange, options }) => (
  <label className="flex min-w-[170px] flex-col gap-1">
    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export default function DriverControlsSection({
  controls,
  onControlsChange,
  onReset,
}) {
  const timeRangeOptions = (controls?.options?.timeRanges || ['7d', '30d', '90d', 'mtd', 'qtd', 'custom']).map(
    (value) => ({ value, label: value.toUpperCase() }),
  );
  const compareOptions = (
    controls?.options?.compareTo || ['previous_period', 'same_period_last_month', 'custom_previous', 'none']
  ).map((value) => ({
    value,
    label: value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
  }));
  const basisOptions = (controls?.options?.costBasis || ['actual', 'amortized', 'net']).map((value) => ({
    value,
    label: value.toUpperCase(),
  }));
  const dimensionOptions = (controls?.options?.dimensions || ['service', 'account', 'region', 'team', 'sku']).map(
    (value) => ({
      value,
      label: `By ${value.charAt(0).toUpperCase()}${value.slice(1)}`,
    }),
  );

  const isCustom = controls.timeRange === 'custom';
  const isCustomCompare = controls.compareTo === 'custom_previous';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
        <SelectField
          label="Time Range"
          value={controls.timeRange}
          onChange={(value) => onControlsChange({ timeRange: value })}
          options={timeRangeOptions}
        />
        <SelectField
          label="Compare To"
          value={controls.compareTo}
          onChange={(value) => onControlsChange({ compareTo: value })}
          options={compareOptions}
        />
        <SelectField
          label="Cost Basis"
          value={controls.costBasis}
          onChange={(value) => onControlsChange({ costBasis: value })}
          options={basisOptions}
        />
        <SelectField
          label="Primary Table"
          value={controls.dimension}
          onChange={(value) => onControlsChange({ dimension: value })}
          options={dimensionOptions}
        />
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Reset
        </button>
      </div>

      {isCustom ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Start</span>
            <input
              type="date"
              value={controls.startDate}
              onChange={(event) => onControlsChange({ startDate: event.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current End</span>
            <input
              type="date"
              value={controls.endDate}
              onChange={(event) => onControlsChange({ endDate: event.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>
      ) : null}

      {isCustomCompare ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Compare Start</span>
            <input
              type="date"
              value={controls.previousStartDate}
              onChange={(event) => onControlsChange({ previousStartDate: event.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Compare End</span>
            <input
              type="date"
              value={controls.previousEndDate}
              onChange={(event) => onControlsChange({ previousEndDate: event.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>
      ) : null}
    </section>
  );
}
