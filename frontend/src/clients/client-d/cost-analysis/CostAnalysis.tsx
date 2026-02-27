import React, { useState, useMemo, useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "../../../store/Authstore";

import CostAnalysisView from "./CostAnalysisView";
import { useCostAnalysis } from "./hooks/useCostAnalysis";
import type {
  CostAnalysisProps,
  CostBreakdownItem,
  CostChartRow,
  CostChartType,
  CostFilters,
  CostKpis,
  CostModalType,
} from "./types";

const CostAnalysis = ({ api, caps }: CostAnalysisProps) => {
  // Don't render if module not enabled or API not available
  if (!api || !caps || !caps.modules?.["costAnalytics"]?.enabled) return null;

  return <CostAnalysisContent api={api} caps={caps} />;
};

const CostAnalysisContent = ({ api, caps }: CostAnalysisProps) => {
  const { user } = useAuthStore();
  const isLocked = !user?.is_premium; // mask if NOT premium

  const [activeModal, setActiveModal] = useState<CostModalType>(null);
  const activeTab = "overview";
  const filters: CostFilters = { provider: "All", service: "All", region: "All" };
  const groupBy = "ServiceName";
  const [chartType, setChartType] = useState<CostChartType>("area");
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());


  const { loading, isRefreshing, apiData, error } = useCostAnalysis({
    api,
    caps,
    filters,
    groupBy,
  });


 

  const toggleSeries = useCallback((key: string) => {
    setHiddenSeries((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const kpis = useMemo<CostKpis>(() => {
    const baseKpis: CostKpis = {
      totalSpend: 0,
      avgDaily: 0,
      peakUsage: 0,
      trend: 0,
      ...(apiData?.kpis ?? {}),
    };
    // Compute additional KPIs from dailyTrends
    const dailyTrends = (apiData?.dailyTrends || []) as CostChartRow[];
    if (dailyTrends.length > 0) {
      const totals = dailyTrends.map((d: CostChartRow) => Number(d.total || 0));
      const maxTotal = Math.max(...totals);
      const peakDate = dailyTrends.find((d: CostChartRow) => Number(d.total || 0) === maxTotal)?.date;
      const mid = Math.floor(dailyTrends.length / 2);
      const firstHalf = dailyTrends.slice(0, mid).reduce((sum: number, d: CostChartRow) => sum + Number(d.total || 0), 0);
      const secondHalf = dailyTrends.slice(mid).reduce((sum: number, d: CostChartRow) => sum + Number(d.total || 0), 0);
      const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
      baseKpis.peakUsage = maxTotal;
      if (peakDate) baseKpis.peakDate = peakDate;
      baseKpis.trend = trend;
    }
    return baseKpis;
  }, [apiData]);
  const chartData = useMemo<CostChartRow[]>(() => (apiData?.dailyTrends as CostChartRow[]) || [], [apiData]);
  const activeKeys = useMemo(() => {
    const keys = new Set<string>();
    (apiData?.dailyTrends || []).forEach((day: CostChartRow) => {
      Object.keys(day).forEach((key: string) => {
        if (key !== "date" && key !== "total") keys.add(key);
      });
    });
    return Array.from(keys);
  }, [apiData]);
  const breakdown = useMemo<CostBreakdownItem[]>(
    () =>
      ((apiData?.breakdown || []) as CostBreakdownItem[]).map((b: CostBreakdownItem) => ({
        ...b,
        value: parseFloat(String(b.value ?? 0)),
      })),
    [apiData],
  );

  return (
    <div className="flex flex-col h-full bg-[#0f0f11] text-white overflow-hidden relative font-sans selection:bg-[#007758]/30">
      

      {/* CONTROLS */}
      <div className="px-6 pt-4 shrink-0 space-y-4 relative z-[40]">
        {/* No controls for now, as per core-dashboard */}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0 relative z-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Full loader only initial */}
        {loading && !apiData && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0f0f11]/60 backdrop-blur-[2px]">
            <Loader2 className="animate-spin text-[#007758]" size={32} />
          </div>
        )}

        {/* Subtle updating */}
        {isRefreshing && apiData && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-[#007758]/20 border border-[#007758]/30 rounded-lg backdrop-blur-sm">
            <Loader2 className="text-[#007758] animate-spin" size={14} />
            <span className="text-[#007758] text-xs font-medium">Updating...</span>
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
