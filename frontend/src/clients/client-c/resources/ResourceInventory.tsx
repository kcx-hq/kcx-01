import React, { useMemo, useState, useCallback } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';

import ResourceInventoryView from './ResourceInventoryView';
import { useClientCResourceInventoryData } from './hooks/useClientCResourceInventoryData';
import type {
  ResourceInventoryData,
  ResourceInventoryFilters,
  ResourceInventoryProps,
} from './types';

const ResourceInventory = ({ api, caps }: ResourceInventoryProps) => {
  // Local filters
  const [filters, setFilters] = useState<ResourceInventoryFilters>({
    provider: "All",
    service: "All",
    region: "All"
  });

  // Debounced filters
  const debouncedFilters = useDebounce(filters, 500);

  // Fetch resource inventory data
  const {
    data: resourceData,
    loading: loadingResources,
    error: errorResources,
  } = useClientCResourceInventoryData(debouncedFilters, api, caps);

  // Handle filter changes (LOCAL ONLY)
  const handleFilterChange = useCallback((newFilters: Partial<ResourceInventoryFilters>) => {
    setFilters((prev: ResourceInventoryFilters) => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Reset filters
  const handleReset = useCallback(() => {
    setFilters({
      provider: "All",
      service: "All",
      region: "All"
    });
  }, []);

  // Extract data for view
  const extractedData = useMemo<ResourceInventoryData | null>(() => {
    if (!resourceData) return null;

    return {
      inventory: resourceData.inventory || [],
      stats: resourceData.stats || {}
    };
  }, [resourceData]);

  // UI states
  const isLoading = loadingResources;
  const hasError = Boolean(errorResources);
  const errorMessage = errorResources;

  // Filtering indicator
  const isFiltering =
    JSON.stringify(filters) !== JSON.stringify(debouncedFilters);

  // Empty state
  const isEmptyState =
    !isLoading &&
    !hasError &&
    (!extractedData || extractedData.inventory.length === 0);

  return (
    <ResourceInventoryView
      api={api}
      caps={caps}
      filters={filters}
      onFilterChange={handleFilterChange}
      onReset={handleReset}
      loading={isLoading}
      isFiltering={isFiltering}
      resourceData={resourceData}
      extractedData={extractedData}
      isEmptyState={isEmptyState}
      error={errorMessage}
    />
  );
};

export default ResourceInventory;
