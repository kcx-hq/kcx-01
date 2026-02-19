// frontend/clients/client-d/dashboards/cost-analysis/CostAnalysisView.jsx
import React, { useMemo } from "react";
import {
  DollarSign,
  Activity,
  Maximize2,
  TrendingUp,
  Crown,
  Lock,
  Info,
} from "lucide-react";

import KpiCard from "../../../core-dashboard/cost-analysis/components/KpiCard";
import SpendBehaviorCard from "../../../core-dashboard/cost-analysis/components/SpendBehaviorCard";
import BreakdownSidebar from "../../../core-dashboard/cost-analysis/components/BreakdownSidebar";
import PremiumGate from "../../../core-dashboard/common/PremiumGate";
import BreakdownModal from "../../../core-dashboard/cost-analysis/components/BreakdownModal";
import InfoModal from "../../../core-dashboard/cost-analysis/components/InfoModal";

import { formatCurrency, formatDate } from "./utils/format";

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
  const showPremiumChartsOverlay =
    isLocked && (chartType === "bar" || chartType === "line");

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

  const momentumLabel = useMemo(() => {
    const t = Number(kpis?.trend ?? 0);
    if (!isFinite(t) || t === 0) return "Stable";
    return t > 0 ? "Rising" : "Cooling";
  }, [kpis?.trend]);

  const hasChartData = Array.isArray(chartData) && chartData.length > 0;

  return (
    <>
      {activeTab === "overview" && (
        <div className="space-y-4 pt-4">
          {/* HERO HEADER */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#171820] to-[#121319] p-5 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0">
                <div className="text-white font-extrabold text-lg tracking-tight">
                  Cost Analysis
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Spend behavior + breakdown view (Client-D layout)
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
                    Total:{" "}
                    <span className="text-white font-semibold">
                      {formatCurrency(kpis.totalSpend)}
                    </span>
                  </span>

                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
                    Avg/Day:{" "}
                    <span className="text-white font-semibold">
                      {isLocked ? "Premium" : formatCurrency(kpis.avgDaily)}
                    </span>
                  </span>

                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
                    Momentum:{" "}
                    <span className="text-white font-semibold">
                      {momentumLabel}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveModal("breakdown")}
                  className="px-4 py-2 rounded-xl bg-[#a02ff1]/10 hover:bg-[#a02ff1]/20 border border-[#a02ff1]/30 text-[#a02ff1] text-xs font-extrabold transition flex items-center gap-2"
                >
                  <Info size={14} />
                  View Breakdown
                </button>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="rounded-2xl border border-white/10 bg-[#121319] p-4 shadow-2xl">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">
              Key metrics
            </div>

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

                return isLocked ? (
                  <div key={c.label} className="relative">
                    <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-xl">
                      <div className="text-center p-2">
                        <Crown
                          size={14}
                          className="text-yellow-400 mx-auto mb-1"
                        />
                        <span className="text-yellow-400 font-bold text-[9px]">
                          Premium
                        </span>
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
          </div>

          {/* ✅ CHART SECTION (RESTORED + FIXED HEIGHT) */}
          <div className="bg-[#121319] border border-white/10 rounded-2xl p-4 shadow-2xl relative">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-white font-bold">Spend Behavior</div>
                <div className="text-xs text-gray-500">
                  Daily trend (Total + top services)
                </div>
              </div>

              <div className="text-[10px] text-gray-500">
                Chart type:{" "}
                <span className="text-gray-300 font-semibold">{chartType}</span>
              </div>
            </div>

            {showPremiumChartsOverlay && (
              <PremiumGate
                title="Premium Feature"
                buttonText="Upgrade to Access"
                icon={<Lock size={16} />}
                onAction={() => setChartType("area")}
                rounded="rounded-2xl"
              />
            )}

            {!hasChartData ? (
              <div className="h-[420px] flex items-center justify-center text-gray-500 text-sm">
                No trend data available
              </div>
            ) : (
              <div className="h-[420px]">
                <SpendBehaviorCard
                  isLocked={isLocked}
                  chartType={chartType}
                  setChartType={setChartType}
                  chartData={chartData}
                  activeKeys={activeKeys}
                  hiddenSeries={hiddenSeries}
                  toggleSeries={toggleSeries}   
                  kpis={kpis}
                />
              </div>
            )}
          </div>

          {/* SECONDARY: Breakdown + Insights */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <BreakdownSidebar
                isLocked={isLocked}
                breakdown={breakdown}
                hiddenSeries={hiddenSeries}
                toggleSeries={toggleSeries}
                totalSpend={kpis.totalSpend}
                activeKeys={activeKeys}
              />
            </div>

            <div className="bg-[#121319] border border-white/10 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white font-bold">Insights</div>
                <button
                  onClick={() => setActiveModal("trend")}
                  className="text-xs text-[#a02ff1] hover:underline"
                >
                  Details
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                    Peak
                  </div>
                  <div className="text-sm text-white font-semibold mt-1">
                    {isLocked ? "Premium" : formatCurrency(kpis.peakUsage)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isLocked
                      ? "Upgrade to see peak date"
                      : formatDate(kpis.peakDate)}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                    Momentum
                  </div>
                  <div className="text-sm text-white font-semibold mt-1">
                    {kpis.trend
                      ? `${kpis.trend > 0 ? "+" : ""}${kpis.trend.toFixed(1)}%`
                      : "0%"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {momentumLabel} vs previous half
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal("breakdown")}
                  className="w-full px-4 py-2 rounded-xl bg-[#a02ff1]/10 hover:bg-[#a02ff1]/20 border border-[#a02ff1]/30 text-[#a02ff1] text-xs font-extrabold transition"
                >
                  Open Full Breakdown
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
