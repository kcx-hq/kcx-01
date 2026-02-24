import React from "react";
import { Gauge, X } from "lucide-react";
import MetricCard from "../shared/MetricCard";
import { getToneBadgeClass } from "../../utils/view.helpers";
import type { KpiInsightDefinition, KpiInsightKey } from "./types";

interface KpiDeckSectionProps {
  kpiInsights: KpiInsightDefinition[];
  activeKpiInsight?: KpiInsightDefinition;
  onToggleKpi: (key: KpiInsightKey) => void;
  onCloseInsight: () => void;
}

const KpiDeckSection = ({
  kpiInsights,
  activeKpiInsight,
  onToggleKpi,
  onCloseInsight,
}: KpiDeckSectionProps) => {
  return (
    <section className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-emerald-700" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">KPI Deck</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Click any KPI for context
        </span>
      </div>
      <div
        className={`grid grid-cols-1 gap-3 transition md:grid-cols-2 xl:grid-cols-4 ${
          activeKpiInsight ? "pointer-events-none opacity-40" : "opacity-100"
        }`}
      >
        {kpiInsights.map((kpi) => (
          <MetricCard
            key={kpi.key}
            label={kpi.label}
            value={kpi.value}
            suffix={kpi.suffix}
            active={activeKpiInsight?.key === kpi.key}
            onClick={() => onToggleKpi(kpi.key)}
          />
        ))}
      </div>
      {activeKpiInsight ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-emerald-50/75 p-4 backdrop-blur-[1px]" onClick={onCloseInsight}>
          <div
            className="w-full max-w-[460px] rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">KPI Insight</p>
                <p className="text-sm font-black text-slate-900">{activeKpiInsight.label}</p>
              </div>
              <button
                type="button"
                onClick={onCloseInsight}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-700"
                aria-label="Close insight"
              >
                <X size={12} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-base font-black text-slate-900">
                {activeKpiInsight.value}
                {activeKpiInsight.suffix ? (
                  <span className="ml-1 text-xs font-bold text-slate-500">{activeKpiInsight.suffix}</span>
                ) : null}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getToneBadgeClass(activeKpiInsight.tone)}`}
              >
                {activeKpiInsight.status}
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-600">{activeKpiInsight.meaning}</p>
            <div className="mt-3 space-y-1.5">
              {activeKpiInsight.quickNotes.map((note, index) => (
                <div key={`${activeKpiInsight.key}-note-${index}`} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="text-xs font-semibold text-slate-700">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default KpiDeckSection;
