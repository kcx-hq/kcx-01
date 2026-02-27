import React from 'react';
import type { StatusBadgeProps } from "../types";

const StatusBadge = ({ status = "Active" }: StatusBadgeProps) => {
  const styles: Record<string, string> = {
    Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Spiking: 'border-amber-200 bg-amber-50 text-amber-700',
    Zombie: 'border-orange-200 bg-orange-50 text-orange-700',
    New: 'border-sky-200 bg-sky-50 text-sky-700',
  };

  return (
    <span
      className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
        styles[status] || styles["Active"]
      }`}
    >
      {status}
    </span>
  );
};

export { StatusBadge };
export default StatusBadge;



