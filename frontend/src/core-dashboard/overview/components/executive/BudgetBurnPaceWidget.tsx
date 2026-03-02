import React from "react";
import { TrendingUp } from "lucide-react";
import { BudgetBurn } from "../../types";
import { formatPct, formatSignedPct, statusChipClass, toSafeNumber } from "./formatters";

interface BudgetBurnPaceWidgetProps {
  budgetBurn: BudgetBurn;
}

const BudgetBurnPaceWidget = ({ budgetBurn }: BudgetBurnPaceWidgetProps) => {
  const budgetConsumedPercent = toSafeNumber(budgetBurn?.budgetConsumedPercent);
  const monthElapsedPercent = toSafeNumber(budgetBurn?.monthElapsedPercent);
  const paceGapPercent = toSafeNumber(budgetBurn?.varianceToPacePercent);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[var(--brand-primary)]" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
            Budget Burn Pace
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusChipClass(
              budgetBurn?.status || "Watch"
            )}`}
          >
            {budgetBurn?.status || "Watch"}
          </span>
          {budgetBurn?.status === "Over budget" && (
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
              Breach ETA: {budgetBurn?.breachEtaLabel || "Within month"}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>Budget consumed</span>
            <span className="font-semibold text-slate-700">{formatPct(budgetConsumedPercent)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full ${paceGapPercent > 0 ? "bg-rose-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(100, budgetConsumedPercent)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>Month elapsed</span>
            <span className="font-semibold text-slate-700">{formatPct(monthElapsedPercent)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-[var(--brand-primary)]"
              style={{ width: `${Math.min(100, monthElapsedPercent)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Pace gap:{" "}
          <strong className={paceGapPercent > 0 ? "text-rose-700" : "text-emerald-700"}>
            {formatSignedPct(paceGapPercent, 1)}
          </strong>
        </p>
      </div>
    </section>
  );
};

export default BudgetBurnPaceWidget;
