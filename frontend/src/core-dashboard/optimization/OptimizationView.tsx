import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Target,
  Zap,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

import Tabs from "./components/Tabs";
import PremiumGate from "../common/PremiumGate";
import { SectionLoading, SectionRefreshOverlay } from "../common/SectionStates";
import OpportunitiesTab from "./components/OpportunitiesTab";
import IdleResourcesTab from "./components/IdleResourcesTab";
import RightSizingTab from "./components/RightSizingTab";
import CommitmentsTab from "./components/CommitmentsTab";
import InsightModal from "./components/InsightModal";
import ResourceSidePanel from "./components/ResourceSidePanel";
import ActionCenterOverviewTab from "./components/ActionCenterOverviewTab";

export function OptimizationView({
  isMasked,
  activeTab,
  setActiveTab,
  expandedItems,
  toggleExpand,
  selectedInsight,
  setSelectedInsight,
  selectedResource,
  setSelectedResource,
  idleFilter,
  setIdleFilter,
  idleSort,
  setIdleSort,
  idleSearch,
  setIdleSearch,
  filteredIdleResources,
  optimizationData,
  loading,
  error,
  isRefreshing,
  onRetry,
}) {
  if (loading) {
    return <SectionLoading label="Analyzing Optimization..." />;
  }

  if (error || !optimizationData) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-[var(--border-light)] bg-white p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle size={32} className="text-rose-600" />
            <p className="text-[var(--text-muted)]">{error || "No optimization data available"}</p>
            <button
              onClick={onRetry}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-[var(--brand-primary)] transition-colors hover:bg-emerald-100"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Action Center", icon: Sparkles },
    { id: "opportunities", label: "Top Opportunities", icon: Target },
    { id: "idle", label: "Idle Resources", icon: Zap },
    { id: "rightsizing", label: "Right-Sizing", icon: TrendingDown },
    { id: "commitments", label: "Commitments", icon: AlertCircle },
  ];

  return (
    <div className="core-shell animate-in fade-in zoom-in-95 duration-300">
      <div className="core-panel">
        <h1 className="flex items-center gap-2 text-xl font-black text-[var(--text-primary)] md:text-2xl">
          <Sparkles size={24} className="text-[var(--brand-primary)]" />
          Optimization Insights
        </h1>
        <p className="mt-1 text-sm italic text-[var(--text-muted)]">
          Decision-support intelligence. No actions are executed from this platform.
        </p>
      </div>

      <Tabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      {isMasked ? (
        <div className="relative flex h-[400px] items-center justify-center overflow-hidden rounded-xl border border-[var(--border-light)] bg-white">
          <PremiumGate variant="full" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="relative">
              <ActionCenterOverviewTab
                model={optimizationData.actionCenterModel}
                onSelectInsight={setSelectedInsight}
              />
              {isRefreshing && <SectionRefreshOverlay rounded="rounded-xl" label="Refreshing action center..." />}
            </motion.div>
          )}

          {activeTab === "opportunities" && (
            <motion.div key="opportunities" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="relative">
              <OpportunitiesTab opportunities={optimizationData.opportunities} onSelectInsight={setSelectedInsight} />
              {isRefreshing && <SectionRefreshOverlay rounded="rounded-xl" label="Refreshing opportunity insights..." />}
            </motion.div>
          )}

          {activeTab === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="relative">
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
              {isRefreshing && <SectionRefreshOverlay rounded="rounded-xl" label="Refreshing idle resource analysis..." />}
            </motion.div>
          )}

          {activeTab === "rightsizing" && (
            <motion.div key="rightsizing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="relative">
              <RightSizingTab
                rightSizingRecs={optimizationData.rightSizingRecs}
                onSelectInsight={(rec) => setSelectedInsight({ ...rec, type: "rightsizing" })}
              />
              {isRefreshing && <SectionRefreshOverlay rounded="rounded-xl" label="Refreshing right-sizing recommendations..." />}
            </motion.div>
          )}

          {activeTab === "commitments" && (
            <motion.div key="commitments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="relative">
              <CommitmentsTab commitmentGap={optimizationData.commitmentGap} />
              {isRefreshing && <SectionRefreshOverlay rounded="rounded-xl" label="Refreshing commitment insights..." />}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <InsightModal selectedInsight={selectedInsight} onClose={() => setSelectedInsight(null)} />
      <ResourceSidePanel selectedResource={selectedResource} onClose={() => setSelectedResource(null)} />
    </div>
  );
}

export default OptimizationView;
