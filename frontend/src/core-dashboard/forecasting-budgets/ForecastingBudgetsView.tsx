import { useState } from "react";
import { SectionEmpty, SectionError, SectionLoading, SectionRefreshOverlay } from "../common/SectionStates";
import type { ForecastingBudgetsPayload, ForecastingControls } from "./types";
import { ControlsSection } from "./components/sections/ControlsSection";
import { ConfidenceGatingSection } from "./components/sections/ConfidenceGatingSection";
import { ForecastAccuracySection } from "./components/sections/ForecastAccuracySection";
import { ForecastBreakdownSection } from "./components/sections/ForecastBreakdownSection";
import { ForecastKpiSection } from "./components/sections/ForecastKpiSection";
import { ForecastTimelineSection } from "./components/sections/ForecastTimelineSection";
import { HeaderSection } from "./components/sections/HeaderSection";
import { PlanningModelSection } from "./components/sections/PlanningModelSection";
import { SubmoduleSections } from "./components/sections/SubmoduleSections";

interface ForecastingBudgetsViewProps {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  data: ForecastingBudgetsPayload;
  controls: ForecastingControls;
  onControlsChange: (patch: Partial<ForecastingControls>) => void;
  filters: { provider?: string; service?: string; region?: string };
  api: {
    call: (
      module: string,
      endpoint: string,
      options?: { params?: Record<string, unknown>; data?: unknown },
    ) => Promise<unknown>;
  } | null;
  onBudgetSaved: () => void;
}

export function ForecastingBudgetsView({
  loading,
  refreshing,
  error,
  data,
  controls,
  onControlsChange,
  filters,
  api,
  onBudgetSaved,
}: ForecastingBudgetsViewProps) {
  const [activePill, setActivePill] = useState<"forecasting" | "budget">("forecasting");

  if (loading) return <SectionLoading label="Analyzing Forecasting & Budgets..." />;
  if (error) return <SectionError message={error} />;
  if (!data?.controls) return <SectionEmpty message="No forecasting data available." />;

  const currency = data.controls.currency || "USD";
  const modules = data.submodules;
  if (
    !modules?.budgetSetupOwnership ||
    !modules?.forecastEngine ||
    !modules?.budgetBurnControls ||
    !modules?.scenarioPlanning ||
    !modules?.forecastActualTracking ||
    !modules?.alertsEscalation
  ) {
    return <SectionEmpty message="No forecasting data available for selected scope." />;
  }

  return (
    <div className="core-shell animate-in fade-in duration-300 space-y-4">
      <HeaderSection
        controls={controls}
        filters={filters}
        executiveSentence={
          activePill === "budget"
            ? "Budget control view: track burn alignment, owner accountability, and active threshold alerts."
            : data.executiveSentence
        }
      />
      <ControlsSection controls={controls} onControlsChange={onControlsChange} />

      <div className="relative space-y-4">
        {refreshing ? (
          <SectionRefreshOverlay rounded="rounded-2xl" label="Refreshing forecasting & budgets..." />
        ) : null}
        <section className="rounded-2xl border border-[var(--border-light)] bg-white p-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActivePill("forecasting")}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                activePill === "forecasting"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Forecasting
            </button>
            <button
              type="button"
              onClick={() => setActivePill("budget")}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                activePill === "budget"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Budget
            </button>
          </div>
        </section>

        {activePill === "forecasting" ? (
          <>
            <ForecastKpiSection
              kpi={data.kpiStrip}
              confidence={data.confidence}
              forecastView={data.forecastView}
              currency={currency}
            />
            <ForecastTimelineSection data={data} currency={currency} />
            <ForecastBreakdownSection data={data} currency={currency} />
            <ForecastAccuracySection data={data} currency={currency} />
            <ConfidenceGatingSection
              confidence={data.confidence}
              checklist={data.forecastView?.confidenceChecklist}
            />
          </>
        ) : (
          <>
            <PlanningModelSection
              data={data}
              currency={currency}
              mode="budget"
              api={api}
              filters={filters}
              controls={controls}
              onControlsChange={onControlsChange}
              onBudgetSaved={onBudgetSaved}
            />
            <SubmoduleSections data={data} currency={currency} mode="budget" />
          </>
        )}
      </div>
    </div>
  );
}

export default ForecastingBudgetsView;
