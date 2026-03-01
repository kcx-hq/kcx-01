import React, { useMemo, useState } from "react";
import { Gauge } from "lucide-react";
import KpiInsightModal from "../../../common/components/KpiInsightModal";
import type { SpendAnalyticsKpiCard } from "../../types";
import { formatCurrency, formatDate } from "../../utils/format";
import { formatSignedPercent } from "../../utils/view.helpers";

interface SpendKpiDeckSectionProps {
  cards: SpendAnalyticsKpiCard[];
  contextLabel: string;
}

const statusClassMap: Record<string, string> = {
  on_track: "bg-emerald-100 text-emerald-700",
  watch: "bg-amber-100 text-amber-700",
  critical: "bg-rose-100 text-rose-700",
};
const requiredKpiKeys = new Set([
  "totalSpend",
  "runRateDaily",
  "peakDailySpend",
  "volatilityIndex",
  "concentrationRisk",
]);

const formatKpiValue = (card: SpendAnalyticsKpiCard) => {
  if (card.valueType === "percent") {
    return `${card.value.toFixed(2)}%`;
  }
  if (card.valueType === "number") {
    return card.value.toLocaleString();
  }
  return formatCurrency(card.value);
};

const SpendKpiDeckSection = ({ cards, contextLabel }: SpendKpiDeckSectionProps) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const visibleCards = useMemo(() => {
    const filtered = cards.filter((card) => requiredKpiKeys.has(card.key));
    return filtered.length ? filtered : cards.slice(0, 5);
  }, [cards]);
  const selected = useMemo(
    () => visibleCards.find((card) => card.key === selectedKey) || null,
    [visibleCards, selectedKey]
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-emerald-700" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">KPI Deck</h2>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Click a KPI for context
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {visibleCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setSelectedKey((prev) => (prev === card.key ? null : card.key))}
            className={`rounded-2xl border p-4 text-left transition ${
              selected?.key === card.key
                ? "border-emerald-300 bg-emerald-50/40"
                : "border-slate-100 bg-white hover:border-emerald-200"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.title}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{formatKpiValue(card)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                {card.comparison.label} {formatSignedPercent(card.comparison.deltaPercent)}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  statusClassMap[card.status] || "bg-slate-100 text-slate-700"
                }`}
              >
                {card.status.replace(/_/g, " ")}
              </span>
            </div>
          </button>
        ))}
      </div>

      <KpiInsightModal
        open={Boolean(selected)}
        title={selected?.title || "KPI Detail"}
        value={selected ? formatKpiValue(selected) : null}
        summary={null}
        contextLabel={contextLabel}
        points={
          selected
            ? [
                `${selected.comparison.label}: ${formatSignedPercent(selected.comparison.deltaPercent)}`,
                selected.context?.peakDate ? `Peak date: ${formatDate(selected.context.peakDate)}` : "",
                ...(selected.context?.insightPoints || []),
              ].filter(Boolean)
            : []
        }
        badgeText={selected?.status || null}
        onClose={() => setSelectedKey(null)}
      />
    </section>
  );
};

export default SpendKpiDeckSection;
