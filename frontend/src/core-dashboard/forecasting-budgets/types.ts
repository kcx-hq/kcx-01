export type ConfidenceStatus = "pass" | "warn" | "fail";

export interface ForecastingControls {
  period: "mtd" | "qtd" | "30d" | "90d";
  compareTo: "previous_period" | "same_period_last_month" | "none";
  costBasis: "actual" | "amortized" | "net";
}

export interface KpiStrip {
  eomForecastAllocatedCost: number;
  budgetConsumptionPct: number;
  budgetVarianceForecast: number;
  burnRate: number;
  breachEtaDays: number | null;
  requiredDailySpend: number;
  forecastDrift: number;
  unitCostForecast: number;
  mapePct: number | null;
  atRiskBudgetCount: number;
}

export interface ConfidenceGate {
  id: string;
  label: string;
  value: number;
  status: ConfidenceStatus;
  threshold: string;
  consequence: string;
}

export interface ConfidenceModel {
  forecastConfidence: {
    score: number;
    level: "high" | "medium" | "low";
    advisoryOnly: boolean;
  };
  budgetConfidence: {
    score: number;
    level: "high" | "medium" | "low";
    advisoryOnly: boolean;
  };
  confidenceBandPct: number;
  consequences: string[];
  gates: ConfidenceGate[];
}

export interface BudgetRow {
  id: string;
  scopeType: string;
  scope: string;
  owner: string;
  budgetType: string;
  budget: number;
  consumed: number;
  forecast: number;
  variance: number;
  variancePct: number;
  consumptionPct: number;
  timeElapsedPct: number;
  threshold: {
    warn: number;
    high: number;
    breach: number;
  };
  status: "on_track" | "watch" | "at_risk" | "breached";
}

export interface ScenarioModel {
  id: string;
  label: string;
  knobs: {
    volumeGrowthPct: number;
    commitmentCoverageChangePct: number;
    optimizationExecutionRatePct: number;
    sharedPoolShiftPct: number;
  };
  outputs: {
    forecastAllocatedCost: number;
    forecastVolume: number;
    forecastUnitCost: number;
    varianceVsBudget: number;
    breachRiskPct: number;
    marginPerUnitImpact: number | null;
  };
}

export interface AlertModel {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  scope: string;
  owner: string;
  status: "unacknowledged" | "investigating" | "mitigated" | "closed";
  threshold: string;
  current: string;
  links: {
    optimization: string;
    governance: string;
    rootCause: string;
  };
}

export interface ForecastingBudgetsPayload {
  controls: ForecastingControls & { currency: string };
  executiveSentence: string;
  kpiStrip: KpiStrip;
  confidence: ConfidenceModel;
  submodules: {
    budgetSetupOwnership: {
      hierarchy: string[];
      budgetType: string;
      atRiskBudgets: BudgetRow[];
      rows: BudgetRow[];
    };
    forecastEngine: {
      selectedMethod: string;
      methodologyOptions: Array<{ id: string; label: string; useWhen: string }>;
      forecastAllocatedCost: { current: number; lower: number; upper: number; eoq: number };
      forecastVolume: { current: number; lower: number; upper: number };
      forecastUnitCost: { current: number; lower: number; upper: number };
      sensitivity: Array<{ id: string; label: string; allocatedCostDeltaPct: number; unitCostDeltaPct: number }>;
      drivers: { volatilityPct: number; costGrowthPct: number; volumeGrowthPct: number };
    };
    budgetBurnControls: {
      burnRate: number;
      plannedBurnRate: number;
      burnVsPlanPct: number;
      daysRemaining: number;
      breachEtaDays: number | null;
      requiredDailySpend: number;
      overrunAvoidedIfActionsCompleteBy: string | null;
    };
    scenarioPlanning: {
      constraints: string[];
      scenarios: ScenarioModel[];
      recommendedScenario: string | null;
    };
    forecastActualTracking: {
      mapePct: number | null;
      biasPct: number | null;
      accuracyScore: number | null;
      byScope: Array<{ scope: string; actual: number; forecast: number; errorPct: number; biasPct: number }>;
      topMisses: Array<{
        id: string;
        scope: string;
        actual: number;
        forecast: number;
        missValue: number;
        missPct: number;
        biasPct?: number;
        link: string;
      }>;
    };
    alertsEscalation: {
      unacknowledgedCount: number;
      states: string[];
      alerts: AlertModel[];
    };
  };
  metricDictionary: Array<{ metric: string; formula: string; scope: string }>;
  forecastMethodology: Array<{ id: string; label: string; useWhen: string }>;
  budgetStrategy: {
    hierarchy: string[];
    sharedPoolHandling: string;
    thresholds: { warn: number; high: number; breach: number };
    defaultAbsoluteImpactFloor: number;
  };
  nonDuplicationRules: string[];
  crossSectionMap: Array<{ source: string; input: string; output: string }>;
}
