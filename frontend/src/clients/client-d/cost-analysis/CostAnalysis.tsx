import React, { useState, useMemo, useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "../../../store/Authstore";

import CostAnalysisView from "./CostAnalysisView";
import { useCostAnalysis } from "./hooks/useCostAnalysis";

const CostAnalysis = ({ api, caps }) => {
  const { user } = useAuthStore();
  const isLocked = !user?.is_premium; // mask if NOT premium

  // Don't render if module not enabled or API not available
  if (!api || !caps || !caps.modules?.costAnalytics?.enabled) return null;

  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({ provider: "All", service: "All", region: "All" });
  const [groupBy, setGroupBy] = useState("ServiceName");
  const [chartType, setChartType] = useState("area");
  const [hiddenSeries, setHiddenSeries] = useState(new Set());


  const { loading, isRefreshing, apiData, error } = useCostAnalysis({
    api,
    caps,
    filters,
    groupBy,
  });


 

  const toggleSeries = useCallback((key) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const kpis = useMemo(() => {
    const baseKpis = apiData?.kpis || {};
    // Compute additional KPIs from dailyTrends
    const dailyTrends = apiData?.dailyTrends || [];
    if (dailyTrends.length > 0) {
      const totals = dailyTrends.map(d => d.total);
      const maxTotal = Math.max(...totals);
      const peakDate = dailyTrends.find(d => d.total === maxTotal)?.date;
      const mid = Math.floor(dailyTrends.length / 2);
      const firstHalf = dailyTrends.slice(0, mid).reduce((sum, d) => sum + d.total, 0);
      const secondHalf = dailyTrends.slice(mid).reduce((sum, d) => sum + d.total, 0);
      const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
      baseKpis.peakUsage = maxTotal;
      baseKpis.peakDate = peakDate;
      baseKpis.trend = trend;
    }
    return baseKpis;
  }, [apiData]);
  const chartData = useMemo(() => apiData?.dailyTrends || [], [apiData]);
  const activeKeys = useMemo(() => {
    const keys = new Set();
    (apiData?.dailyTrends || []).forEach(day => {
      Object.keys(day).forEach(key => {
        if (key !== 'date' && key !== 'total') keys.add(key);
      });
    });
    return Array.from(keys);
  }, [apiData]);
  const breakdown = useMemo(() => (apiData?.breakdown || []).map(b => ({ ...b, value: parseFloat(b.value) })), [apiData]);

  return (
    <div className="flex flex-col h-full bg-[#0f0f11] text-white overflow-hidden relative font-sans selection:bg-[#a02ff1]/30">
      

      {/* CONTROLS */}
      <div className="px-6 pt-4 shrink-0 space-y-4 relative z-[40]">
        {/* No controls for now, as per core-dashboard */}
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
          />
        )}
      </div>
    </div>
  );
};

export default CostAnalysis;
