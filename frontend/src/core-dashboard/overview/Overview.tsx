import React, { useMemo, useState, useCallback } from "react";
import { useDebounce } from "../../hooks/useDebounce";

import OverviewView from "./OverviewView";
import { normalizeOverviewData } from "./utils/normalizeOverviewData";
import { useOverviewFilters } from "./hooks/useOverviewFilters";
import { useOverviewData } from "./hooks/useOverviewData";
import {
  OverviewApiClient,
  OverviewCaps,
  OverviewFilterPatch,
  OverviewFilters,
  OverviewNormalizedData,
} from "./types";

interface OverviewProps {
  onFilterChange?: (filters: OverviewFilterPatch) => void;
  api: OverviewApiClient | null | undefined;
  caps: OverviewCaps | null | undefined;
}

const defaultFilters: OverviewFilters = {
  provider: "All",
  service: "All",
  region: "All",
};

const Overview = ({ onFilterChange, api, caps }: OverviewProps) => {
  const [filters, setFilters] = useState<OverviewFilters>(defaultFilters);
  const [forceRefreshKey, setForceRefreshKey] = useState<number>(0);

  const debouncedFilters: OverviewFilters = useDebounce(filters, 300);
  const { filterOptions } = useOverviewFilters(api, caps);
  const { overviewData, loading, isFiltering } = useOverviewData(
    api,
    caps,
    debouncedFilters,
    forceRefreshKey
  );

  const extractedData = useMemo<OverviewNormalizedData>(
    () => normalizeOverviewData(overviewData),
    [overviewData]
  );

  const handleFilterChange = useCallback(
    (newFilters: OverviewFilterPatch) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      onFilterChange?.(newFilters);
    },
    [onFilterChange]
  );

  const handleReset = useCallback(() => {
    setFilters(defaultFilters);
    onFilterChange?.(defaultFilters);
    setForceRefreshKey((key) => key + 1);
  }, [onFilterChange]);

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
    />
  );
};

export default Overview;
