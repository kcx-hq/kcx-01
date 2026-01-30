import React, { useMemo } from "react";
import { DollarSign, Activity, Maximize2, TrendingUp, Crown, Lock } from "lucide-react";

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

  apiData,
  kpis,
  chartData,
  activeKeys,
  breakdown,

  activeModal,
  setActiveModal,
}) => {
  const showPremiumChartsOverlay = isLocked && (chartType === "bar" || chartType === "line");

  const kpiCards = useMemo(() => {
    return [
      {
        label: "Total Spend",
        value: kpis.totalSpend,
        icon: DollarSign,
        iconColor: "text-[#a02ff1]",
        premium: false,
        onClick: () => setActiveModal("breakdown"),
      },
      {
        label: "Daily Average",
        value: kpis.avgDaily,
        icon: Activity,
        iconColor: "text-cyan-400",
        premium: true,
        onClick: () => setActiveModal("average"),
      },
      {
        label: "Peak Usage",
        value: kpis.peakUsage,
        icon: Maximize2,
        iconColor: "text-emerald-400",
        premium: true,
        onClick: () => setActiveModal("peak"),
      },
      {
        label: "Momentum",
        value: kpis.trend ? `${Math.abs(kpis.trend).toFixed(1)}%` : "0%",
        icon: TrendingUp,
        iconColor: "text-rose-400",
        premium: true,
        trend: kpis.trend,
        onClick: () => setActiveModal("trend"),
      },
    ];
  }, [kpis, setActiveModal]);

  return (
    <>
      {activeTab === "overview" && (
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {kpiCards.map((c) => {
              if (!c.premium) {
                return (
                  <KpiCard
                    key={c.label}
                    label={c.label}
                    value={c.value}
                    icon={c.icon}
                    iconColor={c.iconColor}
                    trend={c.trend}
                    onClick={c.onClick}
                  />
                );
              }

              // Premium masking for non-premium users (same behavior as your original)
              return isLocked ? (
                <div key={c.label} className="relative">
                  <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-xl">
                    <div className="text-center p-2">
                      <Crown size={14} className="text-yellow-400 mx-auto mb-1" />
                      <span className="text-yellow-400 font-bold text-[9px]">Premium</span>
                    </div>
                  </div>
                  <div className="opacity-50 pointer-events-none">
                    <KpiCard
                      label={c.label}
                      value={c.value}
                      icon={c.icon}
                      iconColor={c.iconColor}
                      trend={c.trend}
                      onClick={() => {}}
                    />
                  </div>
                </div>
              ) : (
                <KpiCard
                  key={c.label}
                  label={c.label}
                  value={c.value}
                  icon={c.icon}
                  iconColor={c.iconColor}
                  trend={c.trend}
                  onClick={c.onClick}
                />
              );
            })}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 h-[450px]">
            <div className="flex-[3] bg-[#1a1b20] border border-white/5 rounded-2xl p-4 relative shadow-2xl flex flex-col">
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
              />
            </div>

            <BreakdownSidebar
              isLocked={isLocked}
              breakdown={breakdown}
              hiddenSeries={hiddenSeries}
              toggleSeries={toggleSeries}
              totalSpend={kpis.totalSpend}
            />
          </div>
        </div>
      )}

      {/* predictability & risk tabs are rendered by parent via children */}
      {activeTab !== "overview" && children}

      {/* MODALS */}
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
