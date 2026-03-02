// apps/frontend/src/features/costDrivers/views/CostDriversView.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, TrendingUp } from "lucide-react";

import { formatDate } from "../../../core-dashboard/cost-drivers/utils/format";

import { DriverDetailsDrawer } from "../../../core-dashboard/cost-drivers/components/DriverDetailsDrawer";
import { DriversList } from "../../../core-dashboard/cost-drivers/components/DriversList";

import { CostDriversHeader } from "./components/CostDriversHeader";
import { NetVarianceCard } from "./components/NetVarianceCard";
import { DynamicsCard } from "./components/DynamicsCard";
import { CostMapCard } from "./components/CostMapCard";
import { CostDriversEmptyState } from "./components/CostDriversEmptyState";
import { CostDriversMessage } from "./components/CostDriversMessage";
import type { CostDriversViewProps } from "./types";

export function CostDriversView(props: CostDriversViewProps) {
  const {
    api,
    caps,

    // access/premium
    isMasked,

    // query controls
    period,
    setPeriod,
    activeServiceFilter,
    setActiveServiceFilter,
    showTreeMap,
    setShowTreeMap,

    // selection
    selectedDriver,
    setSelectedDriver,
    onSelectDriver,
    onBack,

    // sorting
    sortListBy,

    // data
    loading,
    isRefreshing,
    errorMessage,
    increases,
    decreases,
    filteredIncreases,
    filteredDecreases,
    overallStats,
    dynamics,
    periods,
    availableServices,

    // details
    details,
  } = props;

  if (!api || !caps || !caps.modules?.["costDrivers"]?.enabled) return null;

  // Full page loader (initial)
  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#23a282]" size={32} />
          <span>Analyzing cost drivers...</span>
        </div>
      </div>
    );
  }

  const hasNoDrivers =
    !errorMessage && (increases?.length ?? 0) === 0 && (decreases?.length ?? 0) === 0;

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white font-sans">
      <AnimatePresence mode="wait">
        {!selectedDriver ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 space-y-4"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-40 -mx-4 px-4 pt-3 pb-3 bg-[#0f0f11]/85 backdrop-blur border-b border-white/10">
              <CostDriversHeader
                isMasked={isMasked}
                period={period}
                setPeriod={setPeriod}
                activeServiceFilter={activeServiceFilter}
                setActiveServiceFilter={setActiveServiceFilter}
                availableServices={availableServices}
                showTreeMap={showTreeMap}
                setShowTreeMap={setShowTreeMap}
                periods={periods}
              />
            </div>

            {/* Error/info banner */}
            {errorMessage && <CostDriversMessage message={errorMessage} />}

            {/* Refreshing badge */}
            {isRefreshing && (
              <div className="flex justify-end">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#23a282]/20 border border-[#23a282]/30 rounded-lg backdrop-blur-sm">
                  <Loader2 className="text-[#23a282] animate-spin" size={14} />
                  <span className="text-[#23a282] text-xs font-medium">Updating...</span>
                </div>
              </div>
            )}

            {/* New layout grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* LEFT SIDEBAR */}
              <div className="xl:col-span-4 space-y-4">
                <NetVarianceCard overallStats={overallStats} />
                <DynamicsCard
                  showTreeMap={showTreeMap}
                  setShowTreeMap={setShowTreeMap}
                  increases={increases}
                  decreases={decreases}
                  dynamics={dynamics}
                />
              </div>

              {/* RIGHT MAIN */}
              <div className="xl:col-span-8 space-y-4">
                <CostMapCard
                  showTreeMap={showTreeMap}
                  increases={increases}
                  decreases={decreases}
                />

                {/* Lists */}
                {hasNoDrivers ? (
                  <CostDriversEmptyState />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DriversList
                      title="Top Increases"
                      items={filteredIncreases}
                      type="inc"
                      onSelect={onSelectDriver}
                      sortBy={sortListBy}
                    />
                    <DriversList
                      title="Top Savings"
                      items={filteredDecreases}
                      type="dec"
                      onSelect={onSelectDriver}
                      sortBy={sortListBy}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Small footer note */}
            {periods?.prev && periods?.current && (
              <div className="text-[10px] text-gray-500 flex items-center gap-2 pt-2">
                <TrendingUp size={12} className="text-[#23a282]" />
                Comparing <span className="text-gray-300 font-semibold">{formatDate(periods.prev)}</span>{" "}
                → <span className="text-gray-300 font-semibold">{formatDate(periods.current)}</span>
              </div>
            )}
          </motion.div>
        ) : (
          <DriverDetailsDrawer
            key="details"
            driver={selectedDriver}
            period={period}
            onBack={onBack || (() => setSelectedDriver(null))}
            isMasked={isMasked}
            isSavingsDriver={selectedDriver?._driverType === "dec"}
            loadingDetails={details?.loading}
            stats={details?.stats}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
