import type { CostDriverFilters, DriverDynamics, DriverOverallStats, DriverPeriods } from "../types";

export const DEFAULT_FILTERS: CostDriverFilters = { provider: "All", service: "All", region: "All" };

export const DEFAULT_OVERALL_STATS: DriverOverallStats = {
  totalCurr: 0,
  totalPrev: 0,
  diff: 0,
  pct: 0,
  totalIncreases: 0,
  totalDecreases: 0,
};

export const DEFAULT_DYNAMICS: DriverDynamics = {
  newSpend: 0,
  expansion: 0,
  deleted: 0,
  optimization: 0,
};

export const DEFAULT_PERIODS: DriverPeriods = {
  current: null,
  prev: null,
  max: null,
};

export const PERIOD_OPTIONS = [7, 30];



