import React, { useMemo } from "react";
import { 
  DollarSign, 
  Activity, 
  Maximize2, 
  TrendingUp, 
  Crown, 
  Lock,
  Loader2 
} from "lucide-react";

import KpiCard from "./components/KpiCard.jsx";
import SpendBehaviorCard from "./components/SpendBehaviorCard.jsx";
import BreakdownSidebar from "./components/BreakdownSidebar.jsx";
import PremiumGate from "../common/PremiumGate.jsx";
import BreakdownModal from "./components/BreakdownModal.jsx";
import InfoModal from "./components/InfoModal.jsx";

import { formatCurrency, formatDate } from "./utils/format.js";

const CostAnalysisView = ({
  children,
  isLocked,
  activeTab,
  chartType,
  setChartType,
  hiddenSeries,
  toggleSeries,
  onBreakdownReset,
  apiData,
  kpis,
  chartData,
  activeKeys,
  breakdown,
  isLoading = false,
  activeModal,
  setActiveModal,
}) => {
  const showPremiumChartsOverlay = isLocked && (chartType === "bar" || chartType === "line");

  const kpiCards = useMemo(() => {
    return [
      { label: "Total Spend", value: kpis.totalSpend, icon: DollarSign, color: "text-[#a02ff1]", premium: false, action: "breakdown" },
      { label: "Daily Average", value: kpis.avgDaily, icon: Activity, color: "text-cyan-400", premium: true, action: "average" },
      { label: "Peak Usage", value: kpis.peakUsage, icon: Maximize2, color: "text-emerald-400", premium: true, action: "peak" },
      { label: "Momentum", value: kpis.trend ? `${Math.abs(kpis.trend).toFixed(1)}%` : "0%", icon: TrendingUp, color: "text-rose-400", premium: true, action: "trend", trend: kpis.trend },
    ];
  }, [kpis]);

  return (
    <>
      {activeTab === "overview" && (
        <div className="space-y-4 pt-4">
          
          {/* --- KPI SECTION WITH SKELETON ANIMATION --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {isLoading ? (
              // Pulse Skeletons show while loading
              [1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="h-24 bg-[#1a1b20] border border-white/5 rounded-2xl animate-pulse flex flex-col justify-center px-4"
                >
                  <div className="h-3 w-20 bg-white/10 rounded mb-3" />
                  <div className="h-6 w-28 bg-white/10 rounded" />
                </div>
              ))
            ) : (
              // Actual Cards show when data is ready
              kpiCards.map((c) => {
                const isCardLocked = isLocked && c.premium;
                return (
                  <div key={c.label} className="relative group transition-all duration-300">
                    {isCardLocked && (
                      <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl pointer-events-auto">
                        <div className="text-center">
                          <Crown size={14} className="text-yellow-400 mx-auto mb-1" />
                          <span className="text-yellow-400 font-bold text-[9px] uppercase tracking-tight">Premium</span>
                        </div>
                      </div>
                    )}
                    <div className={isCardLocked ? "opacity-40 pointer-events-none" : "opacity-100"}>
                      <KpiCard
                        label={c.label}
                        value={c.value}
                        icon={c.icon}
                        iconColor={c.color}
                        trend={c.trend}
                        onClick={() => setActiveModal(c.action)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* --- CHART SECTION WITH BLUR ANIMATION --- */}
          <div className="relative flex flex-col lg:flex-row gap-4 h-[450px]">
            
            {/* Smooth Fade Overlay during refresh */}
            {isLoading && (
              <div className="absolute inset-0 z-[60] bg-[#0f0f11]/40 backdrop-blur-[3px] rounded-2xl flex flex-col items-center justify-center border border-white/10 transition-all duration-500">
                <div className="bg-[#1a1b20] p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                  <Loader2 className="w-5 h-5 text-[#a02ff1] animate-spin" />
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Syncing Analysis</span>
                </div>
              </div>
            )}

            <div className="flex-[3] bg-[#1a1b20] border border-white/5 rounded-2xl p-4 relative shadow-2xl flex flex-col transition-opacity duration-300">
              {showPremiumChartsOverlay && (
                <PremiumGate
                  title="Premium Feature"
                  buttonText="Upgrade to Access"
                  icon={<Lock size={16} />}
                  onAction={() => setChartType("area")}
                  rounded="rounded-2xl"
                />
              )}

              <SpendBehaviorCard
                isLocked={isLocked}
                chartType={chartType}
                setChartType={setChartType}
                chartData={chartData}
                activeKeys={activeKeys}
                hiddenSeries={hiddenSeries}
                kpis={kpis}
                isRefreshing={isLoading}
              />
            </div>

            <BreakdownSidebar
              isLocked={isLocked}
              breakdown={breakdown}
              hiddenSeries={hiddenSeries}
              toggleSeries={toggleSeries}
              totalSpend={kpis.totalSpend}
              onReset={onBreakdownReset}
              activeKeys={activeKeys}
            />
          </div>
        </div>
      )}

      {activeTab !== "overview" && children}

      {/* --- MODALS --- */}
      <BreakdownModal
        isOpen={activeModal === "breakdown"}
        onClose={() => setActiveModal(null)}
        data={breakdown}
      />

      <InfoModal
        isOpen={activeModal === "peak"}
        onClose={() => setActiveModal(null)}
        title="Peak Usage Detected"
        message="The highest daily spend recorded within this filtered period."
        highlight={formatCurrency(kpis.peakUsage)}
        date={formatDate(kpis.peakDate)}
      />

      <InfoModal
        isOpen={activeModal === "average"}
        onClose={() => setActiveModal(null)}
        title="Daily Average"
        message="The mean cost incurred per day across the active timeframe."
        highlight={formatCurrency(kpis.avgDaily)}
      />

      <InfoModal
        isOpen={activeModal === "trend"}
        onClose={() => setActiveModal(null)}
        title="Spending Momentum"
        message="Comparing the second half of the period vs the first half."
        highlight={`${kpis.trend > 0 ? "+" : ""}${kpis.trend?.toFixed(1)}%`}
      />
    </>
  );
};

export default CostAnalysisView;