import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Target,
  Zap,
  TrendingDown,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

import { formatCurrency } from "./utils/format";
import { Tabs } from "./components/Tabs";
import PremiumGate from "../common/PremiumGate";
import { OpportunitiesTab } from "./components/OpportunitiesTab";
import { IdleResourcesTab } from "./components/IdleResourcesTab";
import { RightSizingTab } from "./components/RightSizingTab";
import { CommitmentsTab } from "./components/CommitmentsTab";
import { InsightModal } from "./components/InsightModal";
import { ResourceSidePanel } from "./components/ResourceSidePanel";

export function OptimizationView({
  // access
  isMasked,

  // state
  activeTab,
  setActiveTab,
  expandedItems,
  toggleExpand,
  selectedInsight,
  setSelectedInsight,
  selectedResource,
  setSelectedResource,

  // idle controls
  idleFilter,
  setIdleFilter,
  idleSort,
  setIdleSort,
  idleSearch,
  setIdleSearch,
  filteredIdleResources,

  // data states
  optimizationData,
  loading,
  error,
  isRefreshing,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-[#a02ff1] animate-spin" />
            <p className="text-gray-400">Loading optimization insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !optimizationData) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-gray-400">
              {error || "No optimization data available"}
            </p>
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-[#a02ff1] hover:bg-[#8e25d9] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "opportunities", label: "Top Opportunities", icon: Target },
    { id: "idle", label: "Idle Resources", icon: Zap },
    { id: "rightsizing", label: "Right-Sizing", icon: TrendingDown },
    { id: "commitments", label: "Commitments", icon: AlertCircle },
  ];

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4 relative min-h-screen">
      {isRefreshing && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-[#a02ff1]/20 border border-[#a02ff1]/30 rounded-lg backdrop-blur-sm">
          <Loader2 className="text-[#a02ff1] animate-spin" size={14} />
          <span className="text-[#a02ff1] text-xs font-medium">
            Updating...
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles size={24} className="text-[#a02ff1]" />
            Optimization Insights
          </h1>
          <p className="text-sm text-gray-400 mt-1 italic">
            Decision-support intelligence. No actions are executed from this
            platform.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      {/* ✅ MASKED CONTENT AREA */}
      {isMasked ? (
        <div className="relative h-[400px] overflow-hidden rounded-xl bg-[#1a1b20] border border-white/10 flex items-center justify-center">
          <PremiumGate variant="full" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "opportunities" && (
            <motion.div
              key="opportunities"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <OpportunitiesTab
                opportunities={optimizationData.opportunities}
                onSelectInsight={setSelectedInsight}
              />
            </motion.div>
          )}

          {activeTab === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <IdleResourcesTab
                idleResources={optimizationData.idleResources}
                filteredIdleResources={filteredIdleResources}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
                idleSearch={idleSearch}
                setIdleSearch={setIdleSearch}
                idleFilter={idleFilter}
                setIdleFilter={setIdleFilter}
                idleSort={idleSort}
                setIdleSort={setIdleSort}
              />
            </motion.div>
          )}

          {activeTab === "rightsizing" && (
            <motion.div
              key="rightsizing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RightSizingTab
                rightSizingRecs={optimizationData.rightSizingRecs}
                onSelectInsight={(rec) =>
                  setSelectedInsight({ ...rec, type: "rightsizing" })
                }
              />
            </motion.div>
          )}

          {activeTab === "commitments" && (
            <motion.div
              key="commitments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CommitmentsTab />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
