import React from "react";
import { ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  suffix?: string;
  active?: boolean;
  onClick?: () => void;
}

const MetricCard = ({ label, value, suffix, active = false, onClick }: MetricCardProps) => {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 group-hover:text-emerald-700">
          {label}
        </p>
        {onClick ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-700">
            Insight
            <ArrowUpRight size={11} />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xl font-black tracking-tight text-slate-900">
        {value}
        {suffix ? <span className="ml-1 text-sm text-slate-500">{suffix}</span> : null}
      </p>
    </>
  );

  const className = `group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition ${
    onClick ? "cursor-pointer hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md" : ""
  } ${active ? "border-emerald-300 ring-2 ring-emerald-200" : ""}`;

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
};

export default MetricCard;
