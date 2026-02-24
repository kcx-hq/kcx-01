import React from "react";

interface SelectControlProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

const SelectControl = ({ label, value, options, onChange }: SelectControlProps) => (
  <div className="flex min-w-[140px] flex-col gap-1.5">
    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
    >
      {options.map((optionValue) => (
        <option key={optionValue} value={optionValue}>
          {optionValue || "Any"}
        </option>
      ))}
    </select>
  </div>
);

export default SelectControl;
