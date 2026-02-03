import React, { useState, useMemo, useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/Authstore";

import FilterBar from "../common/widgets/FilterBar.jsx";
import CostPredictability from "../common/widgets/CostPredictability.jsx";
import CostRisk from "../common/widgets/CostRisk.jsx";

import CostAnalysisView from "./CostAnalysisView.jsx";
import { useCostFilters } from "./hooks/useCostFilters.js";
import { useCostAnalysis } from "./hooks/useCostAnalysis.js";

const CostAnalysis = ({ api, caps }) => {
  const { user } = useAuthStore();
  const isLocked = !user?.is_premium;

  const [filters, setFilters] = useState({ provider: "All", service: "All", region: "All" });

  const handleFilterChange = useCallback((nextFilters) => {
    setFilters((prev) => ({ ...prev, ...nextFilters }));
  }, []);

  const { filterOptions } = useCostFilters({ api, caps });

  const handleFilterReset = useCallback(() => {
    setFilters({ provider: "All", service: "All", region: "All" });
  }, []);

  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [groupBy, setGroupBy] = useState("ServiceName");
  const [chartType, setChartType] = useState("area");
  const [hiddenSeries, setHiddenSeries] = useState(new Set());

  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  const toggleSeries = useCallback((key) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleBreakdownReset = useCallback(() => {
    setHiddenSeries(new Set());
  }, []);

  /* -----------------------------
    Data Fetching
  ----------------------------- */
  const { loading, isRefreshing, apiData, error } = useCostAnalysis({
    api,
    caps,
    filters,
    groupBy,
  });

  // Keep showing existing data during refresh to prevent "layout jump"
  const kpis = useMemo(() => apiData?.kpis || {}, [apiData]);
  const chartData = useMemo(() => apiData?.chartData || [], [apiData]);
  const activeKeys = useMemo(() => apiData?.activeKeys || [], [apiData]);
  const breakdown = useMemo(() => apiData?.breakdown || [], [apiData]);

  if (!api || !caps || !caps.modules?.costAnalysis?.enabled) return null;

  return (
    <div className="flex flex-col h-full bg-[#0f0f11] text-white overflow-hidden relative font-sans">
      {/* CONTROLS */}
      <div className="px-6 pt-4 shrink-0 space-y-4 relative z-[40]">
        <div className="flex gap-1 bg-[#1a1b20] p-1 rounded-lg border border-white/5 w-fit">
          {["overview", "predictability", "risk"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-1.5 text-[11px] font-bold uppercase rounded-md ${
                activeTab === tab
                  ? "bg-[#a02ff1] text-white"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
          providerOptions={filterOptions?.providers || []}
          serviceOptions={filterOptions?.services || []}
          regionOptions={filterOptions?.regions || []}
        />
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 relative min-h-[50vh]">
        {/* Full screen loader ONLY on initial mount (no data yet) */}
        {loading && !apiData && (
          <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f11]/95 backdrop-blur-sm rounded-xl border border-white/5"
            aria-busy="true"
            aria-live="polite"
          >
            <Loader2 className="animate-spin text-[#a02ff1]" size={40} strokeWidth={2} />
            <p className="mt-3 text-sm font-medium text-gray-400">Loading cost analysis…</p>
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
            onBreakdownReset={handleBreakdownReset}
            apiData={apiData}
            kpis={kpis}
            chartData={chartData}
            activeKeys={activeKeys}
            breakdown={breakdown}
            activeModal={activeModal}
            setActiveModal={setActiveModal}
            // CONNECTING THE LOADING STATE HERE
            isLoading={loading || isRefreshing}
          >
            {activeTab === "predictability" && (
              <div className="pt-6">
                <CostPredictability
                  chartData={apiData?.predictabilityChartData || []}
                  anomalies={apiData?.anomalies || []}
                  kpis={kpis}
                />
              </div>
            )}

            {activeTab === "risk" && (
              <div className="pt-6">
                <CostRisk
                  riskData={apiData?.riskData || []}
                  totalSpend={kpis.totalSpend}
                />
              </div>
            )}
          </CostAnalysisView>
        )}
      </div>
    </div>
  );
};

export default CostAnalysis;