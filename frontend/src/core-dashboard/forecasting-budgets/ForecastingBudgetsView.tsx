import { SectionEmpty, SectionError, SectionLoading } from "../common/SectionStates";
import type { ForecastingBudgetsPayload, ForecastingControls } from "./types";
import { ControlsSection } from "./components/sections/ControlsSection";
import { ConfidenceGatingSection } from "./components/sections/ConfidenceGatingSection";
import { ExecutiveKpiSection } from "./components/sections/ExecutiveKpiSection";
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
}

export function ForecastingBudgetsView({
  loading,
  refreshing,
  error,
  data,
  controls,
  onControlsChange,
  filters,
}: ForecastingBudgetsViewProps) {
  if (loading) return <SectionLoading label="Building Forecasting & Budgets..." />;
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
      <HeaderSection controls={controls} filters={filters} executiveSentence={data.executiveSentence} />
      <ControlsSection controls={controls} onControlsChange={onControlsChange} refreshing={refreshing} />
      <ExecutiveKpiSection kpi={data.kpiStrip} currency={currency} />
      <ConfidenceGatingSection confidence={data.confidence} />
      <PlanningModelSection data={data} />
      <SubmoduleSections data={data} currency={currency} />
    </div>
  );
}

export default ForecastingBudgetsView;
