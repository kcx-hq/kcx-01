import type { ForecastingBudgetsPayload } from "../../types";
import { SectionPanel } from "../shared/ui";

interface PlanningModelSectionProps {
  data: ForecastingBudgetsPayload;
}

export function PlanningModelSection({ data }: PlanningModelSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <SectionPanel title="Budget Strategy">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Hierarchy</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {data.budgetStrategy.hierarchy.join(" -> ")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Thresholds</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {data.budgetStrategy.thresholds.warn}% / {data.budgetStrategy.thresholds.high}% /{" "}
              {data.budgetStrategy.thresholds.breach}%
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-600">{data.budgetStrategy.sharedPoolHandling}</p>
      </SectionPanel>

      <SectionPanel title="Forecast Methodology">
        <div className="max-h-[210px] space-y-2 overflow-y-auto pr-1">
          {data.forecastMethodology.map((model) => (
            <div key={model.id} className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">{model.label}</p>
              <p className="mt-1 text-xs text-slate-600">{model.useWhen}</p>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}

