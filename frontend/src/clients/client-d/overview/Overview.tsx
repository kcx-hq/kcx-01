// frontend/clients/client-d/dashboards/overview/Overview.jsx
import React, { useMemo, useState, useCallback } from "react";
import { useDebounce } from "../../../hooks/useDebounce";
import { useAuthStore } from "../../../store/Authstore"; 

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
  const { user } = useAuthStore();

  // Lock charts if user is NOT premium
  const isLocked = !user?.is_premium;

  // Local filters
  const [filters, setFilters] = useState<OverviewFilters>({
    provider: "All",
    service: "All",
    region: "All",
  });

  // Chart limits (keep same as core)
  const [chartFilters, setChartFilters] = useState<OverviewChartFilters>({
    trendChart: { limit: 30 },
    pieChart: { limit: 8 },
    barChart: { limit: 8 },
  });

  // Force refresh after reset (even if debounce doesn't change)
  const [forceRefreshKey, setForceRefreshKey] = useState(0);

  // Debounce filters
  const debouncedFilters = useDebounce(filters, 300);

  // Fetch filter dropdown options (unwraps {success,data})
  const { filterOptions } = useOverviewFilters(api, caps);

  // Fetch overview data (unwraps {success,data})
  const { overviewData, loading, isFiltering } = useOverviewData(
    api,
    caps,
    debouncedFilters,
    forceRefreshKey
  );

  // Normalize Client-D payload to core widget shape
  const extractedData = useMemo(
    () => normalizeOverviewData(overviewData),
    [overviewData]
  );

  // Bar chart data slice
  const filteredGroupedData = useMemo(() => {
    const grouped = extractedData.groupedData;
    return Array.isArray(grouped)
      ? grouped.slice(0, chartFilters.barChart.limit)
      : [];
  }, [extractedData.groupedData, chartFilters.barChart.limit]);

  // Handlers
  const handleFilterChange = useCallback(
    (newFilters: OverviewFilters) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
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
    setChartFilters((prev) => ({ ...prev, trendChart: { limit } }));
  }, []);

  const handleBarChartLimitChange = useCallback((limit: number) => {
    setChartFilters((prev) => ({ ...prev, barChart: { limit } }));
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
      isLocked={isLocked}
    />
  );
};

export default Overview;
