import React from "react";
import { OverviewAction } from "../../types";
import { actionStatusClass, formatUSD, toActionStatus } from "./formatters";

interface TopActionsPreviewProps {
  actions: OverviewAction[];
}

const TopActionsPreview = ({ actions }: TopActionsPreviewProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
        Top Actions This Week
      </h3>
      <p className="text-xs text-slate-500">Highest estimated savings opportunities (Top 5)</p>
    </div>

    <div className="space-y-2">
      {actions.length > 0 ? (
        (() => {
          const totalSavings = actions.reduce((sum, item) => sum + Number(item?.expectedSavings || 0), 0);
          return actions.map((action: OverviewAction, idx: number) => {
            const status = toActionStatus(action?.status);
            const savings = Number(action?.expectedSavings || 0);
            const etaLabel = action?.etaLabel || (action?.etaDays ? `${action.etaDays}d` : null);
            return (
              <div key={`${action?.id}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-700">
                    {action?.title || "Untitled action"}
                  </p>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700">{formatUSD(savings)}/mo</span>
                    <p className="text-[10px] text-slate-500">
                      {totalSavings > 0 ? `${((savings / totalSavings) * 100).toFixed(1)}% of action impact` : "-"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    Owner: {action?.owner || "Unassigned"}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${actionStatusClass(status)}`}
                  >
                    {status}
                  </span>
                  {etaLabel && (
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      ETA: {etaLabel}
                    </span>
                  )}
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {action?.confidence || "Medium"} confidence
                  </span>
                </div>
              </div>
            );
          });
        })()
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          No actions are currently prioritized for this filter set.
        </p>
      )}
    </div>
  </article>
);

export default TopActionsPreview;
