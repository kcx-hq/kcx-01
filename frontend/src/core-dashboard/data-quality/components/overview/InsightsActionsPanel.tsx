import type { ReactNode } from "react";
import type { ActionItem, InsightCardModel } from "./overview.models";
import { toneClasses } from "./overview.models";

interface InsightsActionsPanelProps {
  title: string;
  badgeLabel: string;
  badgeValue: string;
  insights: InsightCardModel[];
  actions: ActionItem[];
  children: ReactNode;
}

export const InsightsActionsPanel = ({
  title,
  badgeLabel,
  badgeValue,
  insights,
  actions,
  children,
}: InsightsActionsPanelProps) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-black text-slate-900 md:text-lg">{title}</h2>
      </div>
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
        {badgeLabel} {badgeValue}
      </span>
    </div>

    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      {insights.map((item) => (
        <article key={item.title} className={`rounded-xl border p-3 ${toneClasses[item.tone]}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">{item.title}</p>
          <p className="mt-1 text-lg font-black text-slate-900">{item.value}</p>
          <p className="mt-1 line-clamp-2 text-[11px] text-slate-700">{item.detail}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Owner: {item.owner}</p>
        </article>
      ))}
    </div>

    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-600">Top Actions</p>
      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
        {actions.map((action) => (
          <article key={`${action.priority}-${action.title}`} className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-black text-slate-800">
              {action.priority} - {action.title}
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">{action.detail}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Owner: {action.owner}</p>
          </article>
        ))}
      </div>
    </div>

    <div className="mt-4 space-y-4">{children}</div>
  </section>
);
