import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { AlertCircle, Loader2, Calendar } from "lucide-react";

import ClientCOptimizationView from "./ClientCOptimizationView.jsx";
import { normalizeOptimizationData } from "./utils/normalizeOptimizationData.js";
import { useClientCOptimizationFilters } from "./hooks/useClientCOptimizationFilters.js";
import { useClientCOptimizationData } from "./hooks/useClientCOptimizationData.js";

const ClientCOptimization = ({ api, caps }) => {
  // Local filters with enhanced state management
  const [filters, setFilters] = useState({
    provider: "All",
    service: "All", 
    region: "All",
    uploadId: null,
  });

  // State for tabs and interactions
  const [activeTab, setActiveTab] = useState("opportunities");
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);

  // Idle resources controls
  const [idleFilter, setIdleFilter] = useState("all");
  const [idleSort, setIdleSort] = useState("savings-desc");
  const [idleSearch, setIdleSearch] = useState("");

  // Refresh management
  const [forceRefreshKey, setForceRefreshKey] = useState(0);

  // Debounce filters for performance
  const debouncedFilters = useDebounce(filters, 300);

  // Fetch filter options
  const { 
    filterOptions, 
    loading: filtersLoading, 
    error: filtersError 
  } = useClientCOptimizationFilters(api, caps);

  // Fetch optimization data
  const { 
    optimizationData, 
    loading: dataLoading, 
    isFiltering,
    error: dataError
  } = useClientCOptimizationData(
    api,
    caps,
    debouncedFilters,
    forceRefreshKey
  );

  // Enhanced data normalization
  const extractedData = useMemo(
    () => {
      const normalized = normalizeOptimizationData(optimizationData);
      return normalized;
    },
    [optimizationData]
  );

  // Toggle expand for items
  const toggleExpand = useCallback((id) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Filter idle resources based on controls
  const filteredIdleResources = useMemo(() => {
    if (!extractedData.idleResources) return [];
    let filtered = [...extractedData.idleResources];

    if (idleSearch) {
      const searchLower = idleSearch.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(searchLower) ||
          r.type?.toLowerCase().includes(searchLower) ||
          r.region?.toLowerCase().includes(searchLower)
      );
    }

    if (idleFilter === "prod") filtered = filtered.filter((r) => r.risk === "Prod");
    if (idleFilter === "non-prod") filtered = filtered.filter((r) => r.risk === "Non-prod");

    return [...filtered].sort((a, b) => {
      switch (idleSort) {
        case "savings-desc":
          return (b.savings || 0) - (a.savings || 0);
        case "savings-asc":
          return (a.savings || 0) - (b.savings || 0);
        case "days-desc":
          return (b.daysIdle || 0) - (a.daysIdle || 0);
        case "days-asc":
          return (a.daysIdle || 0) - (b.daysIdle || 0);
        default:
          return 0;
      }
    });
  }, [extractedData.idleResources, idleFilter, idleSort, idleSearch]);

  // Enhanced filter change handler
  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters((prev) => {
        const updated = { ...prev, ...newFilters };
        // Reset dependent filters when main filter changes
        if (newFilters.provider && newFilters.provider !== "All") {
          updated.service = "All";
          updated.region = "All";
        }
        return updated;
      });
    },
    []
  );

  // Enhanced reset handler
  const handleReset = useCallback(() => {
    const reset = { 
      provider: "All", 
      service: "All", 
      region: "All" 
    };
    setFilters(reset);
    setForceRefreshKey((k) => k + 1);
  }, []);

  // Error state handling
  const hasErrors = filtersError || dataError;
  const isLoading = filtersLoading || dataLoading;

  // Enhanced empty state detection
  const isEmptyState = extractedData?.metadata?.isEmptyState || 
    (extractedData?.opportunities?.length === 0 && 
     extractedData?.idleResources?.length === 0 &&
     extractedData?.rightSizingRecs?.length === 0);

  // Show error state
  if (hasErrors && !isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-red-400 p-4">
          <AlertCircle className="mx-auto mb-2" size={32} />
          <p className="text-sm font-medium mb-1">Error Loading Data</p>
          <p className="text-xs text-gray-500 max-w-md mb-3">
            {filtersError || dataError || 'An unexpected error occurred. Please try again.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  // Show empty state with helpful message
  if (!isLoading && isEmptyState && !optimizationData) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-gray-500 p-4">
          <Calendar className="mx-auto mb-2" size={32} />
          <p className="text-sm font-medium mb-1">No Data Available</p>
          <p className="text-xs text-gray-500 max-w-md mb-3">
            No optimization data found. Please ensure you have selected a billing upload and try adjusting your filters.
          </p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={handleReset}
              className="px-3 py-1 bg-[#a02ff1]/20 hover:bg-[#a02ff1]/30 text-[#a02ff1] rounded text-xs"
            >
              Reset Filters
            </button>
            <button 
              onClick={handleReset}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded text-xs"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Loading overlay */}
      {(isLoading || (dataLoading && !optimizationData)) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0f0f11]/90 backdrop-blur-sm rounded-xl border border-[#a02ff1]/30">
          <div className="text-center bg-[#1a1b20] p-6 rounded-xl border border-white/10">
            <Loader2 className="animate-spin text-[#a02ff1] mx-auto mb-3" size={32} />
            <p className="text-sm text-gray-300 font-medium">Loading optimization insights...</p>
            <p className="text-xs text-gray-500 mt-1">Fetching data from backend</p>
          </div>
        </div>
      )}
      
      <ClientCOptimizationView
        api={api}
        caps={caps}
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        loading={dataLoading}
        isFiltering={isFiltering}
        optimizationData={optimizationData}
        extractedData={extractedData}
        isEmptyState={isEmptyState}
        
        // Tab state
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        
        // Interaction state
        expandedItems={expandedItems}
        toggleExpand={toggleExpand}
        selectedInsight={selectedInsight}
        setSelectedInsight={setSelectedInsight}
        selectedResource={selectedResource}
        setSelectedResource={setSelectedResource}
        
        // Idle resources controls
        idleFilter={idleFilter}
        setIdleFilter={setIdleFilter}
        idleSort={idleSort}
        setIdleSort={setIdleSort}
        idleSearch={idleSearch}
        setIdleSearch={setIdleSearch}
        filteredIdleResources={filteredIdleResources}
      />
    </div>
  );
};

export default ClientCOptimization;