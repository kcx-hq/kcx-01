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
import { motion } from "framer-motion";

import KpiCard from "./components/KpiCard";
import SpendBehaviorCard from "./components/SpendBehaviorCard";
import BreakdownSidebar from "./components/BreakdownSidebar";
import PremiumGate from "../common/PremiumGate";
import BreakdownModal from "./components/BreakdownModal";
import InfoModal from "./components/InfoModal";

import { formatCurrency, formatDate } from "./utils/format";

const BRAND_EMERALD = "#007758";

const CostAnalysisView = ({
  children,
  isLocked,
  activeTab,
  chartType,
  setChartType,
  hiddenSeries,
  toggleSeries,
  onBreakdownReset,
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
      { label: "Aggregate Cost", value: kpis.totalSpend, icon: DollarSign, color: "text-[var(--brand-primary)] bg-emerald-50 border-emerald-100", premium: false, action: "breakdown" },
      { label: "Daily Baseline", value: kpis.avgDaily, icon: Activity, color: "text-emerald-700 bg-emerald-50 border-emerald-100", premium: true, action: "average" },
      { label: "Utilization Peak", value: kpis.peakUsage, icon: Maximize2, color: "text-teal-700 bg-teal-50 border-teal-100", premium: true, action: "peak" },
      { label: "Spend Momentum", value: `${Math.abs(kpis.trend || 0).toFixed(1)}%`, icon: TrendingUp, color: "text-lime-700 bg-lime-50 border-lime-100", premium: true, action: "trend", trend: kpis.trend },
    ];
  }, [kpis]);

  return (
    <>
      {activeTab === "overview" && (
        <div className="space-y-4 md:space-y-5 pt-1 md:pt-2">
          {isLoading && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#007758]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating Cost Analysis...
            </div>
          )}
          
          {/* --- KPI SECTION: RESPONSIVE GRID --- */}
          {/* Changed to 1 col on mobile, 2 on tablet, 4 on desktop */}
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {kpiCards.map((c, idx) => {
                const isCardLocked = isLocked && c.premium;
                return (
                  <motion.div 
                    key={c.label} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative group cursor-pointer"
                  >
                    {isCardLocked && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl border border-white/50 shadow-inner overflow-hidden">
                        <div className="bg-white/90 px-3 py-1.5 rounded-full shadow-lg border border-slate-100 flex items-center gap-2">
                          <Crown size={12} className="text-amber-500" />
                          <span className="text-slate-800 font-black text-[9px] uppercase tracking-widest">Premium</span>
                        </div>
                      </div>
                    )}
                    
                    <div className={`transition-all duration-300 ${isCardLocked ? "opacity-40 grayscale" : "hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/5"}`}>
                      <KpiCard
                        label={c.label}
                        value={c.value}
                        icon={c.icon}
                        iconStyle={c.color}
                        trend={c.trend}
                        onClick={() => !isCardLocked && setActiveModal(c.action)}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {isLoading && (
              <div className="absolute inset-0 z-20 rounded-2xl bg-white/35 backdrop-blur-[1px] border border-white/20 pointer-events-none" />
            )}
          </div>

          {/* --- MAIN ANALYSIS BOARD --- */}
          {/* Layout becomes vertical on small screens (flex-col) and horizontal on LG (flex-row) */}
          <div className="relative flex flex-col lg:flex-row gap-4 md:gap-6 min-h-[400px] lg:min-h-[500px]">
            
            {/* Refreshing Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-[60] bg-white/35 backdrop-blur-[1px] rounded-2xl flex items-center justify-center border border-white/20 transition-all duration-300">
                <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#007758] shadow-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refreshing Charts...
                </div>
              </div>
            )}

            {/* Spend Behavior Canvas - Takes full width on mobile, 3/4 on large screens */}
            <div className="w-full lg:flex-[3] bg-white border border-slate-100 rounded-2xl p-4 md:p-5 relative shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-emerald-100">
              {showPremiumChartsOverlay && (
                <div className="absolute inset-0 z-40 rounded-2xl overflow-hidden">
                  <PremiumGate
                    title="Advanced Charting"
                    description="Unlock trend lines and predictive analysis."
                    buttonText="Upgrade"
                    icon={<Lock size={18} className="text-white" />}
                    onAction={() => setChartType("area")}
                    variant="emerald"
                  />
                </div>
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
                brandColor={BRAND_EMERALD}
              />
            </div>

            {/* Breakdown Intelligence Sidebar - Collapses below graph on mobile */}
            <div className="w-full lg:flex-1 lg:min-w-[280px] xl:min-w-[320px]">
                <BreakdownSidebar
                  isLocked={isLocked}
                  breakdown={breakdown}
                  hiddenSeries={hiddenSeries}
                  toggleSeries={toggleSeries}
                  totalSpend={kpis.totalSpend}
                  onReset={onBreakdownReset}
                  activeKeys={activeKeys}
                  brandColor={BRAND_EMERALD}
                />
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-VIEWS (Predictability / Risk) --- */}
      {activeTab !== "overview" && (
        <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="w-full overflow-x-hidden relative"
        >
            {isLoading && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#007758]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating Insights...
              </div>
            )}
            {children}
        </motion.div>
      )}

      {/* --- MODALS --- */}
      <BreakdownModal
        isOpen={activeModal === "breakdown"}
        onClose={() => setActiveModal(null)}
        data={breakdown}
      />

      <InfoModal
        isOpen={activeModal === "peak"}
        onClose={() => setActiveModal(null)}
        title="Infrastructure Peak"
        message="Identification of the highest fiscal footprint recorded."
        highlight={formatCurrency(kpis.peakUsage)}
        date={formatDate(kpis.peakDate)}
        icon={<Maximize2 className="text-teal-700" />}
      />

      <InfoModal
        isOpen={activeModal === "average"}
        onClose={() => setActiveModal(null)}
        title="Daily Cost Baseline"
        message="The statistical mean calculated per day."
        highlight={formatCurrency(kpis.avgDaily)}
        icon={<Activity className="text-emerald-700" />}
      />

      <InfoModal
        isOpen={activeModal === "trend"}
        onClose={() => setActiveModal(null)}
        title="Spending Velocity"
        message="Delta analyzing intensity between period halves."
        highlight={`${kpis.trend > 0 ? "+" : ""}${kpis.trend?.toFixed(1)}%`}
        status={kpis.trend > 0 ? "increase" : "optimization"}
        icon={<TrendingUp className="text-lime-700" />}
      />
    </>
  );
};

export default CostAnalysisView;
