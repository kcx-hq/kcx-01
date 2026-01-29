import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { AlertCircle, Loader2, Calendar } from "lucide-react";

import ClientCCostAnalysisView from "./ClientCCostAnalysisView.jsx";
import { normalizeCostAnalysisData } from "./utils/normalizeCostAnalysisData.js";
import { useClientCCostAnalysisFilters } from "./hooks/useClientCCostAnalysisFilters.js";
import { useClientCCostAnalysisData } from "./hooks/useClientCCostAnalysisData.js";

const ClientCCostAnalysis = ({ api, caps }) => {
  // Local filters with enhanced state management
  const [filters, setFilters] = useState({
    provider: "All",
    service: "All",
    region: "All",
    groupBy: "ServiceName",
    uploadId: null,
  });

  // Chart configuration
  const [chartFilters, setChartFilters] = useState({
    trendChart: { limit: 30 },
    pieChart: { limit: 8 },
    barChart: { limit: 8 },
  });

  // Refresh management
  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  

  // Debounce filters for performance
  const debouncedFilters = useDebounce(filters, 300);

    
  
  // Fetch filter options
  const { 
    filterOptions, 
    loading: filtersLoading, 
    error: filtersError 
  } = useClientCCostAnalysisFilters(api, caps);
  


  // Fetch cost analysis data
  const { 
    costAnalysisData, 
    loading: dataLoading, 
    isFiltering,
    error: dataError
  } = useClientCCostAnalysisData(
    api,
    caps,
    debouncedFilters,
    forceRefreshKey
  );
  


  // Enhanced data normalization with groupBy context
  const extractedData = useMemo(
    () => {
      console.log('📊 Normalizing cost analysis data:', {
        hasCostAnalysisData: !!costAnalysisData,
        groupBy: filters.groupBy,
        rawTotalSpend: costAnalysisData?.kpis?.totalSpend,
        rawChartDataLength: costAnalysisData?.chartData?.length,
        rawBreakdownLength: costAnalysisData?.breakdown?.length
      });
      
      const normalized = normalizeCostAnalysisData(costAnalysisData, filters.groupBy);
      
      console.log('✅ Data normalized:', {
        totalSpend: normalized.totalSpend,
        chartDataLength: normalized.chartData?.length,
        breakdownLength: normalized.breakdown?.length,
        activeKeysLength: normalized.activeKeys?.length
      });
      
      return normalized;
    },
    [costAnalysisData, filters.groupBy]
  );

  // Enhanced breakdown filtering
  const filteredBreakdownData = useMemo(() => {
    const breakdown = extractedData.breakdown || [];
    const limit = chartFilters.barChart.limit;
    
    console.log('📈 Filtering breakdown data:', {
      originalLength: breakdown.length,
      limit,
      breakdownSample: breakdown.slice(0, 3)
    });
    
    // Sort by value and apply limit
    const filtered = [...breakdown]
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
      
    console.log('✅ Breakdown filtered:', {
      filteredLength: filtered.length,
      topItem: filtered[0]?.name,
      topValue: filtered[0]?.value
    });
    
    return filtered;
  }, [extractedData.breakdown, chartFilters.barChart.limit]);

  // Initialize with first available groupBy option
  useEffect(() => {
    if (!hasInitialized && filterOptions?.groupBy?.length > 0) {
      const firstOption = filterOptions.groupBy[0]?.value || "ServiceName";
      setFilters(prev => ({
        ...prev,
        groupBy: firstOption
      }));
      setHasInitialized(true);
    }
  }, [filterOptions, hasInitialized]);

  // Enhanced filter change handler
  const handleFilterChange = useCallback(
    (newFilters) => {
      console.log('🎯 Filter change triggered:', newFilters);
      setFilters((prev) => {
        const updated = { ...prev, ...newFilters };
        console.log('🔄 Filters updated from', prev, 'to', updated);
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
      region: "All", 
      groupBy: filterOptions?.groupBy?.[0]?.value || "ServiceName"
    };
    setFilters(reset);
    setForceRefreshKey((k) => k + 1);
  }, [filterOptions]);

  // Chart limit handlers
  const handleTrendChartLimitChange = useCallback((limit) => {
    setChartFilters((prev) => ({ ...prev, trendChart: { limit } }));
  }, []);

  const handleBarChartLimitChange = useCallback((limit) => {
    setChartFilters((prev) => ({ ...prev, barChart: { limit } }));
  }, []);

  const handleGroupByChange = useCallback((groupBy) => {
    console.log('🏷️ GroupBy changed to:', groupBy);
    setFilters((prev) => ({ ...prev, groupBy }));
  }, []);
  
  // Error state handling
  const hasErrors = filtersError || dataError;
  const isLoading = filtersLoading || dataLoading;

  // Enhanced empty state detection
  const isEmptyState = extractedData?.metadata?.isEmptyState || 
    (extractedData?.totalSpend === 0 && extractedData?.chartData?.length === 0);
  


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
  if (!isLoading && isEmptyState && !costAnalysisData) {
    
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-gray-500 p-4">
          <Calendar className="mx-auto mb-2" size={32} />
          <p className="text-sm font-medium mb-1">No Data Available</p>
          <p className="text-xs text-gray-500 max-w-md mb-3">
            No cost analysis data found. Please ensure you have selected a billing upload and try adjusting your filters.
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
      {/* Initial Loading overlay - ONLY show on first load */}
      {(dataLoading && !costAnalysisData) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0f0f11]/90 backdrop-blur-sm rounded-xl border border-[#a02ff1]/30">
          <div className="text-center bg-[#1a1b20] p-6 rounded-xl border border-white/10">
            <Loader2 className="animate-spin text-[#a02ff1] mx-auto mb-3" size={32} />
            <p className="text-sm text-gray-300 font-medium">Loading cost analysis...</p>
            <p className="text-xs text-gray-500 mt-1">Fetching data from backend</p>
          </div>
        </div>
      )}
      
      <ClientCCostAnalysisView
        api={api}
        caps={caps}
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        onGroupByChange={handleGroupByChange}
        onReset={handleReset}
        loading={dataLoading}
        isFiltering={isFiltering}
        costAnalysisData={costAnalysisData}
        extractedData={extractedData}
        filteredBreakdownData={filteredBreakdownData}
        chartFilters={chartFilters}
        onTrendLimitChange={handleTrendChartLimitChange}
        onBarLimitChange={handleBarChartLimitChange}
        isEmptyState={isEmptyState}
      />
    </div>
  );
};

export default ClientCCostAnalysis;

// Named export for consistency

export { ClientCCostAnalysis };

