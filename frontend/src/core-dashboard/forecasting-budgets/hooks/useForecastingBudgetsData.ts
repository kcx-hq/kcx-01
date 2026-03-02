import { useCallback, useEffect, useMemo, useState } from "react";
import type { ForecastingBudgetsPayload, ForecastingControls } from "../types";

const EMPTY_DATA: ForecastingBudgetsPayload = {
  controls: {
    period: "mtd",
    compareTo: "previous_period",
    costBasis: "actual",
    currency: "USD",
  },
  executiveSentence: "No forecast available for selected scope.",
  kpiStrip: {
    eomForecastAllocatedCost: 0,
    budgetConsumptionPct: 0,
    budgetVarianceForecast: 0,
    burnRate: 0,
    breachEtaDays: null,
    requiredDailySpend: 0,
    forecastDrift: 0,
    forecastDriftPct: 0,
    unitCostForecast: 0,
    mapePct: null,
    atRiskBudgetCount: 0,
  },
  confidence: {
    forecastConfidence: { score: 0, level: "low", advisoryOnly: true },
    budgetConfidence: { score: 0, level: "low", advisoryOnly: true },
    confidenceBandPct: 45,
    consequences: [],
    gates: [],
  },
  submodules: {
    budgetSetupOwnership: { hierarchy: [], budgetType: "fixed", atRiskBudgets: [], rows: [] },
    forecastEngine: {
      selectedMethod: "hybrid_blend",
      methodologyOptions: [],
      forecastAllocatedCost: { current: 0, lower: 0, upper: 0, eoq: 0 },
      forecastVolume: { current: 0, lower: 0, upper: 0 },
      forecastUnitCost: { current: 0, lower: 0, upper: 0 },
      sensitivity: [],
      drivers: { volatilityPct: 0, costGrowthPct: 0, volumeGrowthPct: 0 },
    },
    budgetBurnControls: {
      burnRate: 0,
      plannedBurnRate: 0,
      burnVsPlanPct: 0,
      daysRemaining: 0,
      breachEtaDays: null,
      requiredDailySpend: 0,
      overrunAvoidedIfActionsCompleteBy: null,
    },
    scenarioPlanning: { constraints: [], scenarios: [], recommendedScenario: null },
    forecastActualTracking: {
      mapePct: null,
      wapePct: null,
      biasPct: null,
      accuracyScore: null,
      byScope: [],
      topMisses: [],
    },
    alertsEscalation: { unacknowledgedCount: 0, states: [], alerts: [] },
  },
  forecastView: {
    kpi: {
      eomForecast: 0,
      lastForecast: 0,
      driftValue: 0,
      driftPct: 0,
      runRatePerDay: 0,
      confidenceLevel: "low",
      confidenceScore: 0,
    },
    timeline: { daysElapsed: 0, totalDays: 0, points: [] },
    composition: { tabs: [] },
    accuracy: { metricLabel: "MAPE", mapePct: null, wapePct: null, biasPct: null, largestMissDays: [] },
    confidenceChecklist: [],
  },
  metricDictionary: [],
  forecastMethodology: [],
  budgetStrategy: {
    hierarchy: [],
    sharedPoolHandling: "",
    thresholds: { warn: 80, high: 90, breach: 100 },
    defaultAbsoluteImpactFloor: 500,
  },
  nonDuplicationRules: [],
  crossSectionMap: [],
};

export function useForecastingBudgetsData({
  api,
  caps,
  filters,
  controls,
}: {
  api: {
    call: (
      module: string,
      endpoint: string,
      options?: { params?: Record<string, unknown>; data?: unknown },
    ) => Promise<unknown>;
  } | null;
  caps: { modules?: Record<string, { enabled?: boolean; endpoints?: Record<string, unknown> }> } | null;
  filters: { provider?: string; service?: string; region?: string };
  controls: ForecastingControls;
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ForecastingBudgetsPayload>(EMPTY_DATA);
  const [reloadToken, setReloadToken] = useState(0);

  const params = useMemo(
    () => ({
      provider: filters?.provider !== "All" ? filters.provider : undefined,
      service: filters?.service !== "All" ? filters.service : undefined,
      region: filters?.region !== "All" ? filters.region : undefined,
      period: controls.period,
      compareTo: controls.compareTo,
      costBasis: controls.costBasis,
      budgetMonth: controls.budgetMonth || undefined,
    }),
    [
      filters?.provider,
      filters?.service,
      filters?.region,
      controls.period,
      controls.compareTo,
      controls.costBasis,
      controls.budgetMonth,
    ],
  );

  useEffect(() => {
    if (!api || !caps?.modules?.forecastingBudgets?.enabled) {
      setLoading(false);
      setRefreshing(false);
      setError(null);
      setData(EMPTY_DATA);
      return;
    }

    let active = true;
    setError(null);
    setRefreshing(!loading);

    (async () => {
      try {
        const res = (await api.call("forecastingBudgets", "summary", { params })) as
          | ForecastingBudgetsPayload
          | null;
        if (!active) return;
        setData(res || EMPTY_DATA);
      } catch (fetchError) {
        if (!active) return;
        const code = (fetchError as { code?: string })?.code;
        if (code !== "NOT_SUPPORTED") {
          console.error("Forecasting & Budgets fetch failed:", fetchError);
          setError("Failed to load Forecasting & Budgets data.");
        }
        setData(EMPTY_DATA);
      } finally {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [api, caps, params, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  return { loading, refreshing, error, data, reload };
}
