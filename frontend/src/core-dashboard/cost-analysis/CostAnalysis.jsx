import React, { useState, useMemo, useCallback, useEffect } from "react";
import { AlertCircle, BarChart2, Zap, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/Authstore";
import { SectionLoading } from "../common/SectionStates.jsx";

import FilterBar from "../common/widgets/FilterBar.jsx";
import CostPredictability from "../common/widgets/CostPredictability.jsx";
import CostRisk from "../common/widgets/CostRisk.jsx";

import CostAnalysisView from "./CostAnalysisView.jsx";
import { useCostFilters } from "./hooks/useCostFilters.js";
import { useCostAnalysis } from "./hooks/useCostAnalysis.js";

const CostAnalysis = ({ api, caps }) => {
  const { user } = useAuthStore();
  const isLocked = !user?.is_premium;

  // --- STATE ---
  const [filters, setFilters] = useState({ provider: "All", service: "All", region: "All" });
  const [activeTab, setActiveTab] = useState("overview");
  const [groupBy, setGroupBy] = useState("ServiceName");
  const [chartType, setChartType] = useState("area");
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const [activeModal, setActiveModal] = useState(null);

  // --- HOOKS ---
  const { filterOptions } = useCostFilters({ api, caps });
  const { loading, isRefreshing, apiData, error } = useCostAnalysis({
    api,
    caps,
    filters,
    groupBy,
  });

  // --- HANDLERS ---
  const handleFilterChange = useCallback((nextFilters) => {
    setFilters((prev) => ({ ...prev, ...nextFilters }));
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters({ provider: "All", service: "All", region: "All" });
  }, []);

  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  const toggleSeries = useCallback((key) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // --- DATA MEMOIZATION ---
  const kpis = useMemo(() => apiData?.kpis ?? {
    totalSpend: 0, 
    avgDaily: 0, 
    peakUsage: 0, 
    trend: 0 
  }, [apiData]);

  const chartData = useMemo(() => apiData?.chartData ?? [], [apiData]);

  // Build one canonical key list so chart + breakdown always share same key ordering/colors.
  const activeKeys = useMemo(() => {
    const apiKeys = Array.isArray(apiData?.activeKeys) ? apiData.activeKeys : [];
    const dataKeysSet = new Set();
    const excludedKeys = new Set(["total", "totals", "totalcost", "total_cost", "totalspend", "total_spend"]);

    (chartData || []).forEach((row) => {
      Object.keys(row || {}).forEach((k) => {
        const normalized = String(k || "").toLowerCase().replace(/\s+/g, "");
        if (
          k !== "date" &&
          !excludedKeys.has(normalized) &&
          row[k] !== undefined &&
          row[k] !== null
        ) {
          dataKeysSet.add(k);
        }
      });
    });

    const dataKeys = Array.from(dataKeysSet);
    const merged = apiKeys.length === 0
      ? dataKeys
      : [
          ...apiKeys.filter((k) => dataKeysSet.has(k)),
          ...dataKeys.filter((k) => !apiKeys.includes(k)),
        ];

    // Stable total-based ordering so highest-cost service keeps the primary color
    // and draw order does not "jump" when services are toggled.
    const totals = Object.fromEntries(
      merged.map((key) => [
        key,
        (chartData || []).reduce((sum, row) => sum + (Number(row?.[key]) || 0), 0),
      ])
    );

    return [...merged].sort((a, b) => {
      const diff = (totals[b] || 0) - (totals[a] || 0);
      if (diff !== 0) return diff;
      return merged.indexOf(a) - merged.indexOf(b);
    });
  }, [apiData, chartData]);

  // Derive breakdown from the filtered chart data to guarantee filter-sync with graph.
  const breakdown = useMemo(() => {
    const isExcluded = (name) => {
      const normalized = String(name || "").toLowerCase().replace(/\s+/g, "");
      return ["total", "totals", "totalcost", "total_cost", "totalspend", "total_spend"].includes(normalized);
    };

    if (!Array.isArray(chartData) || chartData.length === 0 || activeKeys.length === 0) {
      return Array.isArray(apiData?.breakdown)
        ? apiData.breakdown
            .filter((item) => !isExcluded(item?.name))
            .sort((a, b) => (Number(b?.value) || 0) - (Number(a?.value) || 0))
        : [];
    }

    const items = activeKeys.map((key) => {
      const total = chartData.reduce((sum, row) => sum + (Number(row?.[key]) || 0), 0);
      return { name: key, value: total };
    });
    return items.sort((a, b) => (b.value || 0) - (a.value || 0));
  }, [chartData, activeKeys, apiData]);

  // Remove stale hidden keys when filters/groupBy change active series.
  useEffect(() => {
    setHiddenSeries((prev) => {
      const next = new Set([...prev].filter((k) => activeKeys.includes(k)));
      return next.size === prev.size ? prev : next;
    });
  }, [activeKeys]);

  if (!api || !caps || !caps.modules?.costAnalysis?.enabled) return null;

  // Section-first loading: keep UI clean until backend data arrives.
  if (loading && !apiData) {
    return <SectionLoading label="Analyzing Cost Analysis..." />;
  }

  return (
    <div className="flex flex-col h-full relative font-sans">
      
      {/* --- RESPONSIVE COMMAND DECK --- */}
      <div className="shrink-0 relative z-[40] mb-3 md:mb-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 mb-4 md:mb-8">
            
            {/* TAB NAVIGATION: Scrollable on mobile, flex on desktop */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl md:rounded-2xl border border-slate-200/40 backdrop-blur-sm overflow-x-auto no-scrollbar scroll-smooth">
              {[
                { id: "overview", label: "Overview", icon: BarChart2 },
                { id: "predictability", label: "Predictability", icon: Zap },
                { id: "risk", label: "Risk Matrix", icon: ShieldAlert },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 md:px-5 py-1.5 md:py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all duration-300 whitespace-nowrap
                    ${activeTab === tab.id
                      ? "bg-white text-[#007758] shadow-sm border border-slate-200/50"
                      : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  <tab.icon size={12} className="md:w-[14px] md:h-[14px]" strokeWidth={activeTab === tab.id ? 3 : 2} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FILTER BAR: Responsive padding and layout handled inside FilterBar */}
          <div className="pt-3 md:pt-1 border-t border-slate-50">
            <FilterBar
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
              providerOptions={filterOptions?.providers || []}
              serviceOptions={filterOptions?.services || []}
              regionOptions={filterOptions?.regions || []}
            />
          </div>
        </div>
      </div>

      {/* --- DYNAMIC CONTENT AREA --- */}
      <div className="flex-1 relative min-h-[400px]">
        {error ? (
          <div className="h-full flex flex-col items-center justify-center py-10 md:py-20 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-dashed border-slate-200 px-4 text-center">
            <AlertCircle className="text-rose-500 mb-4 w-8 h-8 md:w-10 md:h-10" />
            <p className="text-slate-900 font-black tracking-tight text-sm md:text-base">{error}</p>
          </div>
        ) : (
          <CostAnalysisView
            isLocked={isLocked}
            activeTab={activeTab}
            chartType={chartType}
            setChartType={setChartType}
            hiddenSeries={hiddenSeries}
            toggleSeries={toggleSeries}
            onBreakdownReset={() => setHiddenSeries(new Set())}
            apiData={apiData}
            kpis={kpis}
            chartData={chartData}
            activeKeys={activeKeys}
            breakdown={breakdown}
            activeModal={activeModal}
            setActiveModal={setActiveModal}
            isLoading={isRefreshing}
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {activeTab === "predictability" && (
                  <div className="min-h-[300px] md:min-h-[400px]">
                    <CostPredictability
                      chartData={apiData?.predictabilityChartData ?? []}
                      anomalies={apiData?.anomalies ?? []}
                      kpis={kpis}
                    />
                  </div>
                )}

                {activeTab === "risk" && (
                  <div className="min-h-[300px] md:min-h-[400px]">
                    <CostRisk
                      riskData={apiData?.riskData ?? []}
                      totalSpend={kpis.totalSpend}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CostAnalysisView>
        )}
      </div>
    </div>
  );
};

export default CostAnalysis;
