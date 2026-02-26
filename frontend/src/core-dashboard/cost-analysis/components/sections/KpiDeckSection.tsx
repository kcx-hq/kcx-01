import React from "react";
import { Gauge } from "lucide-react";
import MetricCard from "../shared/MetricCard";
import type { KpiInsightDefinition, KpiInsightKey } from "./types";
import KpiInsightModal from "../../../common/components/KpiInsightModal";

interface KpiDeckSectionProps {
  kpiInsights: KpiInsightDefinition[];
  activeKpiInsight?: KpiInsightDefinition;
  onToggleKpi: (key: KpiInsightKey) => void;
  onCloseInsight: () => void;
  contextLabel?: string;
}

const KpiDeckSection = ({
  kpiInsights,
  activeKpiInsight,
  onToggleKpi,
  onCloseInsight,
  contextLabel,
}: KpiDeckSectionProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-emerald-700" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">KPI Deck</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Click any KPI for context
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 transition md:grid-cols-2 xl:grid-cols-4">
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

      <KpiInsightModal
        open={Boolean(activeKpiInsight)}
        title={activeKpiInsight?.label || "KPI Insight"}
        value={
          activeKpiInsight
            ? `${activeKpiInsight.value}${activeKpiInsight.suffix ? ` ${activeKpiInsight.suffix}` : ""}`
            : null
        }
        summary={activeKpiInsight?.meaning || null}
        points={activeKpiInsight?.quickNotes || []}
        contextLabel={contextLabel}
        badgeText={activeKpiInsight?.status || null}
        onClose={onCloseInsight}
        maxWidthClass="max-w-[460px]"
      />
    </section>
  );
};

export default KpiDeckSection;
