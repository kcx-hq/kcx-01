// frontend/clients/client-d/dashboards/overview/Overview.jsx
import React, { useMemo, useState, useCallback } from "react";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { useAuthStore } from "../../../store/Authstore"; 

import OverviewView from "./OverviewView.jsx";
import { normalizeOverviewData } from "./utils/normalizeOverviewData.js";
import { useOverviewFilters } from "./hooks/useOverviewFilters.js";
import { useOverviewData } from "./hooks/useOverviewData.js";

const Overview = ({ onFilterChange, api, caps }) => {
  const { user } = useAuthStore();

  // Lock charts if user is NOT premium
  const isLocked = !user?.is_premium;

  // Local filters
  const [filters, setFilters] = useState({
    provider: "All",
    service: "All",
    region: "All",
  });

  // Chart limits (keep same as core)
  const [chartFilters, setChartFilters] = useState({
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
    (newFilters) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      onFilterChange?.(newFilters);
    },
    [onFilterChange]
  );

  const handleReset = useCallback(() => {
    const reset = { provider: "All", service: "All", region: "All" };
    setFilters(reset);
    onFilterChange?.(reset);
    setForceRefreshKey((k) => k + 1);
  }, [onFilterChange]);

  const handleTrendChartLimitChange = useCallback((limit) => {
    setChartFilters((prev) => ({ ...prev, trendChart: { limit } }));
  }, []);

  const handleBarChartLimitChange = useCallback((limit) => {
    setChartFilters((prev) => ({ ...prev, barChart: { limit } }));
  }, []);

  return (
    <OverviewView
      api={api}
      caps={caps}
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