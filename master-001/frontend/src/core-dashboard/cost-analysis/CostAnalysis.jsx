import React, { useState, useMemo, useCallback } from "react";
import { Target, AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/Authstore";

import FilterBar from "../common/widgets/FilterBar.jsx";
import CostPredictability from "../common/widgets/CostPredictability.jsx";
import CostRisk from "../common/widgets/CostRisk.jsx";

import CostAnalysisView from "./CostAnalysisView.jsx";
import { useCostFilters } from "./hooks/useCostFilters.js";
import { useCostAnalysis } from "./hooks/useCostAnalysis.js";

const CostAnalysis = ({ onFilterChange, api, caps }) => {
  const { user } = useAuthStore();
  const isLocked = !user?.is_premium; // mask if NOT premium

  // Don't render if module not enabled or API not available
  if (!api || !caps || !caps.modules?.costAnalysis?.enabled) return null;

  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({ provider: "All", service: "All", region: "All" });
  const [groupBy, setGroupBy] = useState("ServiceName");
  const [chartType, setChartType] = useState("area");
  const [hiddenSeries, setHiddenSeries] = useState(new Set());

  const { filterOptions } = useCostFilters({ api, caps });

  const { loading, isRefreshing, apiData, error } = useCostAnalysis({
    api,
    caps,
    filters,
    groupBy,
  });

  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters((prev) => {
        const hasChanges =
          prev.provider !== newFilters.provider ||
          prev.service !== newFilters.service ||
          prev.region !== newFilters.region;

        if (!hasChanges) return prev;
        return { ...prev, ...newFilters };
      });

      if (onFilterChange) onFilterChange(newFilters);
    },
    [onFilterChange]
  );

  const toggleSeries = useCallback((key) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const kpis = useMemo(() => apiData?.kpis || {}, [apiData]);
  const chartData = useMemo(() => apiData?.chartData || [], [apiData]);
  const activeKeys = useMemo(() => apiData?.activeKeys || [], [apiData]);
  const breakdown = useMemo(() => apiData?.breakdown || [], [apiData]);

  return (
    <div className="flex flex-col h-full bg-[#0f0f11] text-white overflow-hidden relative font-sans selection:bg-[#a02ff1]/30">
      

      {/* CONTROLS */}
      <div className="px-6 pt-4 shrink-0 space-y-4 relative z-[40]">
        <div className="flex justify-between items-end">
          <div className="flex gap-1 bg-[#1a1b20] p-1 rounded-lg border border-white/5 w-fit">
            {["overview", "predictability", "risk"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-[#a02ff1] text-white shadow-lg"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <FilterBar
            filters={filters}
            onChange={handleFilterChange}
            groupBy={groupBy}
            onGroupChange={setGroupBy}
            providerOptions={filterOptions?.providers || []}
            serviceOptions={filterOptions?.services || []}
            regionOptions={filterOptions?.regions || []}
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0 relative z-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Full loader only initial */}
        {loading && !apiData && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0f0f11]/60 backdrop-blur-[2px]">
            <Loader2 className="animate-spin text-[#a02ff1]" size={32} />
          </div>
        )}

        {/* Subtle updating */}
        {isRefreshing && apiData && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-[#a02ff1]/20 border border-[#a02ff1]/30 rounded-lg backdrop-blur-sm">
            <Loader2 className="text-[#a02ff1] animate-spin" size={14} />
            <span className="text-[#a02ff1] text-xs font-medium">Updating...</span>
          </div>
        )}

        {error ? (
          <div className="h-full flex items-center justify-center text-red-500">
            <AlertCircle className="mr-2" /> {error}
          </div>
        ) : (
          <CostAnalysisView
            isLocked={isLocked}
            activeTab={activeTab}
            chartType={chartType}
            setChartType={setChartType}
            hiddenSeries={hiddenSeries}
            toggleSeries={toggleSeries}
            apiData={apiData}
            kpis={kpis}
            chartData={chartData}
            activeKeys={activeKeys}
            breakdown={breakdown}
            activeModal={activeModal}
            setActiveModal={setActiveModal}
          >
            {/* Tab pages that depend on existing shared widgets */}
            {activeTab === "predictability" && (
              <div className="pt-6 relative min-h-[600px]">
                <div className={isLocked ? "opacity-50 pointer-events-none" : ""}>
                  <CostPredictability
                    chartData={apiData?.predictabilityChartData || []}
                    anomalies={apiData?.anomalies || []}
                    kpis={kpis}
                  />
                </div>
              </div>
            )}

            {activeTab === "risk" && (
              <div className="pt-6 h-full relative min-h-[600px]">
                <div className={isLocked ? "opacity-50 pointer-events-none" : ""}>
                  <CostRisk riskData={apiData?.riskData || []} totalSpend={kpis.totalSpend} />
                </div>
              </div>
            )}
          </CostAnalysisView>
        )}
      </div>
    </div>
  );
};

export default CostAnalysis;
