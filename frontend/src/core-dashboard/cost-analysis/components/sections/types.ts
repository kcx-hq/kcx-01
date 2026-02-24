import type { BreakdownRow, SpendAnomalyItem, SpendAnalyticsFilters, SpendTopMoverItem } from "../../types";

export type MetricTone = "neutral" | "positive" | "warning" | "critical";

export type KpiInsightKey =
  | "totalSpend"
  | "avgDailySpend"
  | "peakDailySpend"
  | "trendPercent"
  | "volatilityScore"
  | "topConcentrationShare"
  | "anomalyImpact"
  | "predictabilityScore";

export interface KpiInsightDefinition {
  key: KpiInsightKey;
  label: string;
  value: string;
  suffix?: string;
  hint: string;
  tone: MetricTone;
  status: string;
  meaning: string;
  quickNotes: string[];
}

export interface BusinessInsightItem {
  label: string;
  headline: string;
  detail: string;
  tone: MetricTone;
}

export type BreakdownTabKey =
  | "byProvider"
  | "byService"
  | "byRegion"
  | "byAccount"
  | "byTeam"
  | "byApp"
  | "byEnv"
  | "byCostCategory";

export interface BreakdownTabOption {
  key: BreakdownTabKey;
  label: string;
}

export interface ChartRow {
  idx: number;
  date: string;
  dateLabel: string;
  total: number;
  previousTotal: number;
  isAnomaly: boolean;
  [seriesKey: string]: number | string | boolean;
}

export interface ChartSeries {
  label: string;
  safeKey: string;
  color: string;
}

export interface NormalizedChart {
  rows: ChartRow[];
  series: ChartSeries[];
}

export interface BreakdownSectionState {
  rows: BreakdownRow[];
  tab: BreakdownTabKey;
  tabLabel: string;
  activeFilterValue: string;
  tabs: BreakdownTabOption[];
  filterMap: Record<BreakdownTabKey, keyof SpendAnalyticsFilters>;
}

export interface AnomalySectionState {
  anomalies: SpendAnomalyItem[];
}

export type TopMoverItem = SpendTopMoverItem;
