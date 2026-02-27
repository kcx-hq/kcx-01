import React from "react";
import { formatCurrency } from "../utils/format";
import type { KpiCardProps, KpiCardToneStyles } from "../types";

const toneStyles: KpiCardToneStyles = {
  neutral: {
    icon: "border-emerald-100 bg-emerald-50 text-[var(--brand-primary)]",
    active: "border-emerald-200 bg-emerald-50/60",
  },
  warning: {
    icon: "border-amber-200 bg-amber-50 text-amber-700",
    active: "border-amber-200 bg-amber-50/60",
  },
  critical: {
    icon: "border-rose-200 bg-rose-50 text-rose-700",
    active: "border-rose-200 bg-rose-50/60",
  },
  info: {
    icon: "border-sky-200 bg-sky-50 text-sky-700",
    active: "border-sky-200 bg-sky-50/60",
  },
};

const KpiCard = ({
  title,
  count,
  cost,
  icon: Icon,
  tone = "neutral",
  isActive,
  onClick,
  label,
}: KpiCardProps) => {
  const style = toneStyles[tone] || toneStyles.neutral;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
        isActive
          ? `${style.active} shadow-[0_12px_26px_-18px_rgba(0,119,88,0.4)]`
          : "border-[var(--border-light)] bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm"
      }`}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className={`rounded-xl border p-2 ${style.icon}`}>
          <Icon size={18} />
        </div>
        <span className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
          {count}
        </span>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="font-mono text-xs text-[var(--text-secondary)]">{formatCurrency(cost)}</span>
          <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
        </div>
      </div>

      {isActive && (
        <div className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-emerald-200/40 blur-2xl" />
      )}
    </button>
  );
};

export default KpiCard;



