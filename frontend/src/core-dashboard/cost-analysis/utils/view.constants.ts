import type { SpendAnalyticsFilters } from "../types";
import type { BreakdownTabKey, BreakdownTabOption } from "../components/sections/types";

export const PALETTE = [
  "#23a282",
  "#0ea5e9",
  "#84cc16",
  "#f59e0b",
  "#23a282",
  "#ef4444",
  "#14b8a6",
  "#64748b",
];

export const BREAKDOWN_TABS: BreakdownTabOption[] = [
  { key: "byService", label: "Service" },
  { key: "byProvider", label: "Provider" },
  { key: "byRegion", label: "Region" },
  { key: "byAccount", label: "Account" },
  { key: "byTeam", label: "Team" },
  { key: "byApp", label: "App" },
  { key: "byEnv", label: "Environment" },
  { key: "byCostCategory", label: "Cost Category" },
];

export const BREAKDOWN_FILTER_MAP: Record<BreakdownTabKey, keyof SpendAnalyticsFilters> = {
  byProvider: "provider",
  byService: "service",
  byRegion: "region",
  byAccount: "account",
  byTeam: "team",
  byApp: "app",
  byEnv: "env",
  byCostCategory: "costCategory",
};

export const DEFAULT_CONTROL_OPTIONS = {
  timeRanges: ["7d", "30d", "90d", "mtd", "qtd", "custom"],
  granularities: ["daily", "weekly", "monthly"],
  compareTo: ["previous_period", "same_period_last_month", "none"],
  costBasis: ["actual", "amortized", "net"],
  groupBy: [
    "ServiceName",
    "RegionName",
    "ProviderName",
    "Account",
    "Team",
    "App",
    "Env",
    "CostCategory",
  ],
};

export const DEFAULT_FILTER_VALUES: Pick<
  SpendAnalyticsFilters,
  | "provider"
  | "service"
  | "region"
  | "account"
  | "subAccount"
  | "app"
  | "team"
  | "env"
  | "costCategory"
  | "tagKey"
  | "tagValue"
> = {
  provider: "All",
  service: "All",
  region: "All",
  account: "All",
  subAccount: "All",
  app: "All",
  team: "All",
  env: "All",
  costCategory: "All",
  tagKey: "",
  tagValue: "",
};
