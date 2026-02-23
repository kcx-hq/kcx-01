import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Filter,
  Gauge,
  Link2,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { TooltipProps } from "recharts";
import { formatCurrency, formatDate } from "./utils/format";
import {
  BreakdownRow,
  CostAnalysisFilterOptions,
  SpendAnalyticsFilterPatch,
  SpendAnalyticsFilters,
  SpendAnalyticsPayload,
} from "./types";

type BreakdownTabKey =
  | "byProvider"
  | "byService"
  | "byRegion"
  | "byAccount"
  | "byTeam"
  | "byApp"
  | "byEnv"
  | "byCostCategory";

interface CostAnalysisViewProps {
  filters: SpendAnalyticsFilters;
  onFiltersChange: (patch: SpendAnalyticsFilterPatch) => void;
  onResetFilters: () => void;
  filterOptions: CostAnalysisFilterOptions;
  spendAnalytics: SpendAnalyticsPayload | null;
  message: string;
  isLoading: boolean;
}

interface SelectControlProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

const PALETTE = [
  "#007758",
  "#0ea5e9",
  "#84cc16",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#64748b",
];

const BREAKDOWN_TABS: Array<{ key: BreakdownTabKey; label: string }> = [
  { key: "byService", label: "Service" },
  { key: "byProvider", label: "Provider" },
  { key: "byRegion", label: "Region" },
  { key: "byAccount", label: "Account" },
  { key: "byTeam", label: "Team" },
  { key: "byApp", label: "App" },
  { key: "byEnv", label: "Environment" },
  { key: "byCostCategory", label: "Cost Category" },
];

const DEFAULT_CONTROL_OPTIONS = {
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

const normalizeOptions = (values: string[], fallback: string[]): string[] =>
  Array.from(new Set([...(Array.isArray(values) ? values : []), ...fallback]));

const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

const DEFAULT_FILTER_VALUES: Pick<
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

const getPointNumeric = (point: unknown, key: string): number => {
  if (!point || typeof point !== "object") return 0;
  const value = (point as Record<string, unknown>)[key];
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getPointString = (point: unknown, key: string): string => {
  if (!point || typeof point !== "object") return "";
  const value = (point as Record<string, unknown>)[key];
  return typeof value === "string" ? value : String(value ?? "");
};

const SelectControl = ({ label, value, options, onChange }: SelectControlProps) => (
  <div className="flex min-w-[140px] flex-col gap-1.5">
    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
    >
      {options.map((optionValue) => (
        <option key={optionValue} value={optionValue}>
          {optionValue || "Any"}
        </option>
      ))}
    </select>
  </div>
);

const MetricCard = ({ label, value, suffix }: { label: string; value: string; suffix?: string }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-2 text-xl font-black tracking-tight text-slate-900">
      {value}
      {suffix ? <span className="ml-1 text-sm text-slate-500">{suffix}</span> : null}
    </p>
  </div>
);

const TrendTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const tooltipDate =
    typeof payload[0]?.payload?.dateLabel === "string"
      ? payload[0]?.payload?.dateLabel
      : String(label ?? "");

  const items = payload
    .filter((entry) => Number(entry.value || 0) !== 0)
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0));

  return (
    <div className="min-w-[220px] rounded-xl border border-slate-700 bg-slate-900 p-3 text-white shadow-xl">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
        {formatDate(tooltipDate)}
      </p>
      <div className="space-y-1.5">
        {items.map((entry, index) => (
          <div key={`${String(entry.name)}-${index}`} className="flex items-center justify-between gap-3">
            <span className="truncate text-[11px] text-slate-200">{entry.name}</span>
            <span className="text-[11px] font-bold">{formatCurrency(Number(entry.value || 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const formatControlLabel = (value: string): string =>
  value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const BREAKDOWN_FILTER_MAP: Record<BreakdownTabKey, keyof SpendAnalyticsFilters> = {
  byProvider: "provider",
  byService: "service",
  byRegion: "region",
  byAccount: "account",
  byTeam: "team",
  byApp: "app",
  byEnv: "env",
  byCostCategory: "costCategory",
};

const CostAnalysisView = ({
  filters,
  onFiltersChange,
  onResetFilters,
  filterOptions,
  spendAnalytics,
  message,
  isLoading,
}: CostAnalysisViewProps) => {
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTabKey>("byService");
  const [showMediumFilters, setShowMediumFilters] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const breakdownListRef = useRef<HTMLDivElement | null>(null);

  const trendSeries = spendAnalytics?.trend?.series ?? [];
  const activeKeys = spendAnalytics?.trend?.activeKeys ?? [];
  const compareLabel = spendAnalytics?.trend?.compareLabel || "Previous period";
  const kpiDeck = spendAnalytics?.kpiDeck;
  const breakdownRows = spendAnalytics?.breakdown?.[breakdownTab] ?? [];
  const anomalyList = spendAnalytics?.anomalyDetection?.list ?? [];
  const riskRows = spendAnalytics?.predictabilityRisk?.riskMatrix ?? [];
  const pareto = spendAnalytics?.concentrationPareto;
  const forecast = spendAnalytics?.predictabilityRisk?.forecast;
  const controlOptions = spendAnalytics?.controls?.options;

  const timeRangeOptions = useMemo(
    () => normalizeOptions(controlOptions?.timeRanges ?? [], DEFAULT_CONTROL_OPTIONS.timeRanges),
    [controlOptions?.timeRanges]
  );
  const granularityOptions = useMemo(
    () => normalizeOptions(controlOptions?.granularities ?? [], DEFAULT_CONTROL_OPTIONS.granularities),
    [controlOptions?.granularities]
  );
  const compareOptions = useMemo(
    () => normalizeOptions(controlOptions?.compareTo ?? [], DEFAULT_CONTROL_OPTIONS.compareTo),
    [controlOptions?.compareTo]
  );
  const costBasisOptions = useMemo(
    () => normalizeOptions(controlOptions?.costBasis ?? [], DEFAULT_CONTROL_OPTIONS.costBasis),
    [controlOptions?.costBasis]
  );
  const groupByOptions = useMemo(
    () => normalizeOptions(controlOptions?.groupBy ?? [], DEFAULT_CONTROL_OPTIONS.groupBy),
    [controlOptions?.groupBy]
  );

  const selectedFilterCount = useMemo(() => {
    let count = 0;
    (Object.keys(DEFAULT_FILTER_VALUES) as Array<keyof typeof DEFAULT_FILTER_VALUES>).forEach((key) => {
      if (filters[key] !== DEFAULT_FILTER_VALUES[key]) count += 1;
    });
    return count;
  }, [filters]);

  const visibleSeriesKeys = useMemo(() => {
    const dataKeys = activeKeys.filter((key) =>
      trendSeries.some((point) => getPointNumeric(point, key) > 0)
    );
    const scopedKeys = dataKeys.slice(0, 8);
    const filtered = scopedKeys.filter((key) => !hiddenSeries.has(key));
    return filtered.length > 0 ? filtered : scopedKeys;
  }, [activeKeys, trendSeries, hiddenSeries]);

  const normalizedChart = useMemo(() => {
    const series = visibleSeriesKeys.map((label, index) => ({
      label,
      safeKey: `series_${index}`,
      color: PALETTE[index % PALETTE.length],
    }));

    const rows = trendSeries.map((point, index) => {
      const row: Record<string, number | string | boolean> = {
        idx: index + 1,
        date: getPointString(point, "date"),
        dateLabel: getPointString(point, "date"),
        total: getPointNumeric(point, "total"),
        previousTotal: getPointNumeric(point, "previousTotal"),
        isAnomaly: Boolean((point as Record<string, unknown>)?.isAnomaly),
      };
      series.forEach((item) => {
        row[item.safeKey] = getPointNumeric(point, item.label);
      });
      return row;
    });

    return { rows, series };
  }, [trendSeries, visibleSeriesKeys]);

  const applyBreakdownFilter = (row: BreakdownRow): void => {
    const key = BREAKDOWN_FILTER_MAP[breakdownTab];
    onFiltersChange({ [key]: row.name } as SpendAnalyticsFilterPatch);
  };

  const resetBreakdownFilters = (): void => {
    onFiltersChange({
      provider: "All",
      service: "All",
      region: "All",
      account: "All",
      team: "All",
      app: "All",
      env: "All",
      costCategory: "All",
    });
  };

  const activeBreakdownFilterField = BREAKDOWN_FILTER_MAP[breakdownTab];
  const activeBreakdownFilterValue = filters[activeBreakdownFilterField];

  useEffect(() => {
    if (breakdownListRef.current) {
      breakdownListRef.current.scrollTop = 0;
    }
  }, [breakdownTab, activeBreakdownFilterValue]);

  if (!spendAnalytics) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-base font-bold text-slate-700">{message || "No spend analytics data available."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-emerald-700" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Global Controls</h2>
            {selectedFilterCount > 0 ? (
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                {selectedFilterCount} active
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setShowMediumFilters((prev) => {
                  const next = !prev;
                  if (!next) setShowAdvancedFilters(false);
                  return next;
                })
              }
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:border-emerald-200 hover:text-emerald-700"
            >
              Medium
              {showMediumFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => showMediumFilters && setShowAdvancedFilters((prev) => !prev)}
              disabled={!showMediumFilters}
              className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-wider ${
                showMediumFilters
                  ? "border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-700"
                  : "cursor-not-allowed border-slate-100 text-slate-300"
              }`}
            >
              Advanced
              {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => {
                setHiddenSeries(new Set());
                setShowAdvancedFilters(false);
                setShowMediumFilters(false);
                onResetFilters();
              }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:border-emerald-200 hover:text-emerald-700"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <SelectControl
            label="Time Range"
            value={filters.timeRange}
            options={timeRangeOptions}
            onChange={(value) => onFiltersChange({ timeRange: value as SpendAnalyticsFilters["timeRange"] })}
          />
          <SelectControl
            label="Granularity"
            value={filters.granularity}
            options={granularityOptions}
            onChange={(value) => onFiltersChange({ granularity: value as SpendAnalyticsFilters["granularity"] })}
          />
          <SelectControl
            label="Compare To"
            value={filters.compareTo}
            options={compareOptions}
            onChange={(value) => onFiltersChange({ compareTo: value as SpendAnalyticsFilters["compareTo"] })}
          />
          <SelectControl
            label="Provider"
            value={filters.provider}
            options={filterOptions.providers}
            onChange={(value) => onFiltersChange({ provider: value })}
          />
          <SelectControl
            label="Service"
            value={filters.service}
            options={filterOptions.services}
            onChange={(value) => onFiltersChange({ service: value })}
          />
          <SelectControl
            label="Region"
            value={filters.region}
            options={filterOptions.regions}
            onChange={(value) => onFiltersChange({ region: value })}
          />
        </div>

        {showMediumFilters ? (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Filter size={14} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Medium Filters
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
              <SelectControl
                label="Account"
                value={filters.account}
                options={filterOptions.accounts}
                onChange={(value) => onFiltersChange({ account: value })}
              />
              <SelectControl
                label="Team"
                value={filters.team}
                options={filterOptions.teams}
                onChange={(value) => onFiltersChange({ team: value })}
              />
              <SelectControl
                label="App"
                value={filters.app}
                options={filterOptions.apps}
                onChange={(value) => onFiltersChange({ app: value })}
              />
              <SelectControl
                label="Environment"
                value={filters.env}
                options={filterOptions.envs}
                onChange={(value) => onFiltersChange({ env: value })}
              />
              <SelectControl
                label="Cost Category"
                value={filters.costCategory}
                options={filterOptions.costCategories}
                onChange={(value) => onFiltersChange({ costCategory: value })}
              />
              <SelectControl
                label="Cost Basis"
                value={filters.costBasis}
                options={costBasisOptions}
                onChange={(value) => onFiltersChange({ costBasis: value as SpendAnalyticsFilters["costBasis"] })}
              />
              <SelectControl
                label="Group By"
                value={filters.groupBy}
                options={groupByOptions}
                onChange={(value) => onFiltersChange({ groupBy: value as SpendAnalyticsFilters["groupBy"] })}
              />
            </div>
          </div>
        ) : null}

        {showMediumFilters && showAdvancedFilters ? (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Filter size={14} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Advanced Filters
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
              <SelectControl
                label="Sub Account"
                value={filters.subAccount}
                options={filterOptions.subAccounts}
                onChange={(value) => onFiltersChange({ subAccount: value })}
              />
              <SelectControl
                label="Tag Key"
                value={filters.tagKey || ""}
                options={["", ...filterOptions.tagKeys]}
                onChange={(value) => onFiltersChange({ tagKey: value })}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tag Value</label>
                <input
                  type="text"
                  value={filters.tagValue}
                  onChange={(event) => onFiltersChange({ tagValue: event.target.value })}
                  placeholder="Optional exact tag value"
                  className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {filters.timeRange === "custom" ? (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(event) => onFiltersChange({ startDate: event.target.value })}
                    className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(event) => onFiltersChange({ endDate: event.target.value })}
                    className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Spend" value={formatCurrency(kpiDeck?.totalSpend ?? 0)} />
        <MetricCard label="Avg Daily Spend" value={formatCurrency(kpiDeck?.avgDailySpend ?? 0)} suffix="/day" />
        <MetricCard label="Peak Daily Spend" value={formatCurrency(kpiDeck?.peakDailySpend ?? 0)} />
        <MetricCard label="Trend vs Compare" value={formatPercent(kpiDeck?.trendPercent ?? 0)} />
        <MetricCard label="Volatility Score" value={formatPercent(kpiDeck?.volatilityScore ?? 0)} />
        <MetricCard label="Top Concentration" value={formatPercent(kpiDeck?.topConcentrationShare ?? 0)} />
        <MetricCard label="Anomaly Impact" value={formatCurrency(kpiDeck?.anomalyImpact ?? 0)} />
        <MetricCard label="Predictability Score" value={formatPercent(kpiDeck?.predictabilityScore ?? 0)} />
      </section>

      <section className="flex min-w-0 items-stretch gap-6 overflow-x-auto">
        <div
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm min-w-0 h-[600px] flex flex-col overflow-hidden"
          style={{ flex: "2.5 1 0%" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-700" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">
                Primary Spend Trend
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Compare: {formatControlLabel(compareLabel)}
            </span>
          </div>

          {trendSeries.length === 0 ? (
            <div className="flex flex-1 min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
              No trend data available for selected filters.
            </div>
          ) : (
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={normalizedChart.rows} margin={{ top: 16, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="idx"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(value) => {
                      const row = normalizedChart.rows.find((item) => Number(item.idx) === Number(value));
                      return String(row?.dateLabel ?? "").slice(5);
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(value) => `$${Number(value).toLocaleString("en-US")}`}
                    domain={[0, (dataMax: number) => (Number.isFinite(dataMax) ? Math.max(dataMax * 1.1, 1) : 1)]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<TrendTooltip />} />

                  {normalizedChart.series.map((item) => (
                    <Area
                      key={item.safeKey}
                      type="monotone"
                      dataKey={item.safeKey}
                      name={item.label}
                      stackId="spend"
                      stroke={item.color}
                      fill={item.color}
                      fillOpacity={0.2}
                      strokeWidth={1.8}
                    />
                  ))}

                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    dot={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="previousTotal"
                    stroke="#334155"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    name={compareLabel}
                  />

                  {normalizedChart.rows
                    .filter((point) => Boolean(point.isAnomaly))
                    .map((point) => (
                      <ReferenceDot
                        key={`anomaly-${String(point.date)}`}
                        x={point.idx}
                        y={point.total}
                        r={5}
                        fill="#ef4444"
                        stroke="#7f1d1d"
                      />
                    ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div
          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm min-w-0 h-[600px] flex flex-col overflow-hidden"
          style={{ flex: "1 1 0%", minWidth: "320px" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge size={16} className="text-emerald-700" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Breakdown Panel</h2>
            </div>
            <button
              onClick={resetBreakdownFilters}
              className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
            >
              Reset
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-1">
            {BREAKDOWN_TABS.map((tab) => {
              const field = BREAKDOWN_FILTER_MAP[tab.key];
              const isApplied = filters[field] !== "All";

              return (
                <button
                  key={tab.key}
                  onClick={() => setBreakdownTab(tab.key)}
                  className={`rounded-lg px-2 py-1 text-[10px] uppercase tracking-wider transition-all ${
                    tab.key === breakdownTab
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-400 font-black"
                      : isApplied
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            ref={breakdownListRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 custom-scroll space-y-2"
          >
            {breakdownRows.map((row) => (
              <button
                type="button"
                key={row.name}
                onClick={() => applyBreakdownFilter(row)}
                className={`w-full rounded-xl border p-2.5 text-left transition ${
                  activeBreakdownFilterValue === row.name
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-bold text-slate-700">{row.name}</p>
                  <span className="text-xs font-bold text-slate-900">{formatCurrency(row.spend)}</span>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">{formatPercent(row.sharePercent)} share</span>
                  <span className={`text-[10px] font-bold ${row.deltaValue >= 0 ? "text-rose-600" : "text-emerald-700"}`}>
                    {row.deltaValue >= 0 ? "+" : ""}
                    {formatCurrency(row.deltaValue)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-600" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Anomaly Detection</h2>
        </div>
        {anomalyList.length === 0 ? (
          <p className="text-sm text-slate-500">No anomalies detected for the selected scope.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            {anomalyList.slice(0, 3).map((anomaly) => (
              <div key={anomaly.id} className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    {anomaly.confidence} confidence
                  </span>
                  <span className="text-xs font-bold text-slate-600">{formatDate(anomaly.detectedAt)}</span>
                </div>
                <p className="mt-2 text-lg font-black text-slate-900">{formatCurrency(anomaly.impact)}</p>
                <p className="text-xs font-semibold text-slate-600">
                  {anomaly.serviceHint} | {anomaly.regionHint} | {anomaly.accountHint}
                </p>
                <div className="mt-2 text-[11px] text-slate-600">
                  <p className="font-semibold">Likely drivers:</p>
                  <p>{anomaly.likelyDrivers.join(", ") || "Mixed drivers"}</p>
                </div>
                <a
                  href={anomaly.billingExplorerLink}
                  className="mt-3 inline-flex rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                >
                  Open Billing Explorer
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock size={16} className="text-emerald-700" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Predictability & Risk</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <MetricCard label="Forecast Spend" value={formatCurrency(forecast?.projectedSpend ?? 0)} />
            <MetricCard label="Lower Bound" value={formatCurrency(forecast?.lowerBound ?? 0)} />
            <MetricCard label="Upper Bound" value={formatCurrency(forecast?.upperBound ?? 0)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Confidence: {forecast?.confidence || "Low"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Predictability: {formatPercent(spendAnalytics.predictabilityRisk.predictabilityScore)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Volatility: {formatPercent(spendAnalytics.predictabilityRisk.volatilityScore)}
            </span>
          </div>

          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="py-2">Dimension</th>
                  <th className="py-2">Spend</th>
                  <th className="py-2">Share</th>
                  <th className="py-2">Volatility</th>
                  <th className="py-2">Risk</th>
                </tr>
              </thead>
              <tbody>
                {riskRows.slice(0, 8).map((risk) => (
                  <tr key={risk.name} className="border-b border-slate-50 text-xs">
                    <td className="py-2 font-semibold text-slate-700">{risk.name}</td>
                    <td className="py-2 text-slate-700">{formatCurrency(risk.spend)}</td>
                    <td className="py-2 text-slate-700">{formatPercent(risk.spendShare)}</td>
                    <td className="py-2 text-slate-700">{formatPercent(risk.volatility)}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          risk.riskLevel === "High"
                            ? "bg-rose-100 text-rose-700"
                            : risk.riskLevel === "Medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {risk.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ArrowUpRight size={16} className="text-emerald-700" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Concentration / Pareto</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Top 10 Services Share</p>
              <p className="mt-1 text-lg font-black text-slate-900">
                {formatPercent(pareto?.top10ServicesShare ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Top 3 Accounts Share</p>
              <p className="mt-1 text-lg font-black text-slate-900">
                {formatPercent(pareto?.top3AccountsShare ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Single Region Share</p>
              <p className="mt-1 text-lg font-black text-slate-900">
                {formatPercent(pareto?.singleRegionShare ?? 0)}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Top Services</p>
            {(pareto?.topServices ?? []).slice(0, 5).map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <span className="truncate text-slate-600">{entry.name}</span>
                <span className="font-semibold text-slate-800">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Link2 size={16} className="text-emerald-700" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Drill-down Paths</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={spendAnalytics.drilldownPaths.varianceDrivers}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
          >
            Variance & Drivers
          </a>
          <a
            href={spendAnalytics.drilldownPaths.resourceInventory}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
          >
            Resource Inventory
          </a>
          <a
            href={spendAnalytics.drilldownPaths.billingExplorer}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
          >
            Billing Data Explorer
          </a>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          Refreshing spend analytics...
        </div>
      ) : null}
      <style>{`
        .fade-in {
          animation: breakdownFadeIn 180ms ease;
        }
        @keyframes breakdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
};

export default CostAnalysisView;
