import React from "react";
import { ArrowUpRight } from "lucide-react";
import { deltaBadgeClass, statusChipClass } from "./formatters";

export interface ExecutiveKpiInfoModel {
  title: string;
  value?: string;
  summary: string;
  details: string[];
  contextLabel?: string;
  badgeText?: string;
}

export interface ExecutiveKpiCardModel {
  key: string;
  label: string;
  value: string;
  comparison: string;
  comparisonValue: number;
  status: string;
  deepLink?: string;
  metaTooltip?: string;
  info: ExecutiveKpiInfoModel;
}

interface ExecutiveKpiStripProps {
  cards: ExecutiveKpiCardModel[];
  activeKey: string | null;
  onCardClick: (card: ExecutiveKpiCardModel) => void;
  onOpenLink?: (card: ExecutiveKpiCardModel) => void;
}

const ExecutiveKpiStrip = ({ cards, activeKey, onCardClick, onOpenLink }: ExecutiveKpiStripProps) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
        Executive KPI Strip
      </h3>
      <p className="text-[11px] text-slate-500">Click a KPI for quick context</p>
    </div>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onCardClick(card)}
          className={`rounded-lg border p-4 text-left transition ${
            activeKey === card.key
              ? "border-[var(--brand-primary)] bg-emerald-50/30 shadow-sm"
              : "border-slate-200 bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
              title={card.metaTooltip || card.label}
            >
              {card.label}
            </p>
            {card.deepLink && onOpenLink ? (
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenLink(card);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Open <ArrowUpRight size={10} />
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xl font-black text-slate-800">{card.value}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2 py-1 text-[10px] font-bold ${deltaBadgeClass(
                card.comparisonValue
              )}`}
            >
              {card.comparison}
            </span>
            <span
              className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusChipClass(
                card.status
              )}`}
            >
              {card.status}
            </span>
          </div>
        </button>
      ))}
    </div>
  </section>
);

export default ExecutiveKpiStrip;
