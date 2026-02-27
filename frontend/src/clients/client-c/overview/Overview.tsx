import React, { useMemo, useState, useCallback } from "react";
import { useDebounce } from "../../../hooks/useDebounce";

import OverviewView from "./OverviewView";
import { normalizeOverviewData } from "./utils/normalizeOverviewData";
import { useOverviewFilters } from "./hooks/useOverviewFilters";
import { useOverviewData } from "./hooks/useOverviewData";
import type {
  OverviewChartFilters,
  OverviewFilters,
  OverviewProps,
} from "./types";

const Overview = ({ onFilterChange, api, caps }: OverviewProps) => {
  // Local filters
  const [filters, setFilters] = useState<OverviewFilters>({
    provider: "All",
    service: "All",
    region: "All",
  });

  // Chart limits
  const [chartFilters, setChartFilters] = useState<OverviewChartFilters>({
    trendChart: { limit: 30 },
    pieChart: { limit: 8 },
    barChart: { limit: 8 },
  });

  // Used to force refresh after reset (even if debounce doesn't change)
  const [forceRefreshKey, setForceRefreshKey] = useState(0);

  // Debounce the filters (same behavior as your original)
  const debouncedFilters = useDebounce(filters, 300);

  // Fetch filter dropdown options
  const { filterOptions } = useOverviewFilters(api, caps);

  // Fetch overview data (handles loading + filtering states + abort)
  const { overviewData, loading, isFiltering } = useOverviewData(
    api,
    caps,
    debouncedFilters,
    forceRefreshKey
  );

  // Normalize backend payload for widgets
  const extractedData = useMemo(
    () => normalizeOverviewData(overviewData),
    [overviewData]
  );

  // Chart data slices
  const filteredGroupedData = useMemo(() => {
    const grouped = extractedData.groupedData;
    return Array.isArray(grouped) ? grouped.slice(0, chartFilters.barChart.limit) : [];
  }, [extractedData.groupedData, chartFilters.barChart.limit]);

  // Handlers
  const handleFilterChange = useCallback(
    (newFilters: Partial<OverviewFilters>) => {
      setFilters((prev: OverviewFilters) => ({ ...prev, ...newFilters }));
      onFilterChange?.(newFilters);
    },
    [onFilterChange]
  );

  const handleReset = useCallback(() => {
    const reset: OverviewFilters = { provider: "All", service: "All", region: "All" };
    setFilters(reset);
    onFilterChange?.(reset);
    setForceRefreshKey((k: number) => k + 1);
  }, [onFilterChange]);

  const handleTrendChartLimitChange = useCallback((limit: number) => {
    setChartFilters((prev: OverviewChartFilters) => ({ ...prev, trendChart: { limit } }));
  }, []);

  const handleBarChartLimitChange = useCallback((limit: number) => {
    setChartFilters((prev: OverviewChartFilters) => ({ ...prev, barChart: { limit } }));
  }, []);

  return (
    <OverviewView
      filters={filters}
      filterOptions={filterOptions}
      onFilterChange={handleFilterChange}
      onReset={handleReset}
      loading={loading}
      isFiltering={isFiltering}
      overviewData={overviewData}
      extractedData={extractedData}
      filteredGroupedData={filteredGroupedData}
      chartFilters={chartFilters}
      onTrendLimitChange={handleTrendChartLimitChange}
      onBarLimitChange={handleBarChartLimitChange}
    />
  );
};

export default Overview;
