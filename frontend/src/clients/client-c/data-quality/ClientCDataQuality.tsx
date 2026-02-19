import React, { useMemo } from "react";
import { AlertCircle, Loader2, Calendar } from "lucide-react";

import ClientCDataQualityView from "./ClientCDataQualityView";
import { normalizeDataQualityData } from "./utils/normalizeDataQualityData";
import { useClientCDataQualityData } from "./hooks/useClientCDataQualityData";

const ClientCDataQuality = ({ api, caps }) => {
  // Fetch data quality data
  const { 
    qualityData, 
    loading: dataLoading, 
    error: dataError
  } = useClientCDataQualityData(api, caps);

  // Data normalization
  const extractedData = useMemo(
    () => normalizeDataQualityData(qualityData),
    [qualityData]
  );

  // Error state handling
  const hasErrors = dataError;
  const isLoading = dataLoading;

  // Enhanced empty state detection
  const isEmptyState = extractedData?.metadata?.isEmptyState || 
    (extractedData?.qualityData?.length === 0 && 
     extractedData?.qualityIssues?.length === 0);

  // Show error state
  if (hasErrors && !isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-red-400 p-4">
          <AlertCircle className="mx-auto mb-2" size={32} />
          <p className="text-sm font-medium mb-1">Error Loading Data</p>
          <p className="text-xs text-gray-500 max-w-md mb-3">
            {dataError || 'An unexpected error occurred. Please try again.'}
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
  
  // Show empty state
  if (!isLoading && isEmptyState && !qualityData) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-gray-500 p-4">
          <Calendar className="mx-auto mb-2" size={32} />
          <p className="text-sm font-medium mb-1">No Data Available</p>
          <p className="text-xs text-gray-500 max-w-md mb-3">
            No data quality analysis found. Please ensure you have selected a billing upload.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Loading overlay */}
      {(isLoading || (dataLoading && !qualityData)) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0f0f11]/90 backdrop-blur-sm rounded-xl border border-[#a02ff1]/30">
          <div className="text-center bg-[#1a1b20] p-6 rounded-xl border border-white/10">
            <Loader2 className="animate-spin text-[#a02ff1] mx-auto mb-3" size={32} />
            <p className="text-sm text-gray-300 font-medium">Loading data quality analysis...</p>
            <p className="text-xs text-gray-500 mt-1">Fetching data from backend</p>
          </div>
        </div>
      )}
      
      <ClientCDataQualityView
        api={api}
        caps={caps}
        loading={dataLoading}
        qualityData={qualityData}
        extractedData={extractedData}
        isEmptyState={isEmptyState}
        dataError={dataError}
      />
    </div>
  );
};

export default ClientCDataQuality;