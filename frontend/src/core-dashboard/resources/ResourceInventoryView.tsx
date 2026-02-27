import React from "react";
import {
  Box,
  Download,
  Search,
  List,
  LayoutGrid,
  Server,
  Ghost,
  Tag,
  TrendingUp,
} from "lucide-react";

import KpiCard from "./components/KpiCard";
import PremiumGate from "../common/PremiumGate";
import ResourceTableView from "./components/ResourceTable";
import GroupedListView from "./components/GroupedList";
import ZombieListView from "./components/ZombieList";
import InspectorDrawerView from "./components/InspectorDrawer";
import { SectionLoading } from "../common/SectionStates";
import type {
  ResourceInputChange,
  ResourceInventoryViewProps,
} from "./types";

const ResourceInventoryView = ({
  loading,
  isPremiumMasked,
  searchTerm,
  activeTab,
  grouping,
  selectedResource,
  stats = {
    total: 0,
    totalCost: 0,
    zombieCount: 0,
    zombieCost: 0,
    untaggedCount: 0,
    untaggedCost: 0,
    spikingCount: 0,
    spikingCost: 0,
  },
  filteredData = [],
  groupedData = {},
  inventory = [],
  flaggedResources = new Set(),
  onExportCSV,
  setSearchTerm,
  setActiveTab,
  setGrouping,
  setSelectedResource,
  onToggleFlag,
}: ResourceInventoryViewProps) => {
  if (loading) {
    return <SectionLoading label="Analyzing Resources..." />;
  }

  const isGatedTab =
    isPremiumMasked && (activeTab === "untagged" || activeTab === "spiking");
  const isZombieGated = isPremiumMasked && activeTab === "zombie";

  return (
    <div className="core-shell animate-in fade-in duration-500">
      <div className="core-panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black tracking-tight md:text-2xl">
            <Box className="text-[var(--brand-primary)]" size={22} /> Asset Manager
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Full inventory visibility and waste detection.
          </p>
        </div>

        <button
          onClick={onExportCSV}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-[var(--brand-primary)] transition-all hover:bg-emerald-100 whitespace-nowrap"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Assets"
          count={stats.total}
          cost={stats.totalCost}
          icon={Server}
          tone="neutral"
          label="Total Spend"
          isActive={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        />
        <KpiCard
          title="Zombie Assets"
          count={stats.zombieCount}
          cost={stats.zombieCost}
          icon={Ghost}
          tone="warning"
          label="Wasted Spend"
          isActive={activeTab === "zombie"}
          onClick={() => setActiveTab("zombie")}
        />
        <div className="relative">
          {isPremiumMasked ? (
            <PremiumGate variant="card">
              <KpiCard
                title="Untagged"
                count={stats.untaggedCount}
                cost={stats.untaggedCost}
                icon={Tag}
                tone="critical"
                label="Unallocated"
                isActive={activeTab === "untagged"}
                onClick={() => setActiveTab("untagged")}
              />
            </PremiumGate>
          ) : (
            <KpiCard
              title="Untagged"
              count={stats.untaggedCount}
              cost={stats.untaggedCost}
              icon={Tag}
              tone="critical"
              label="Unallocated"
              isActive={activeTab === "untagged"}
              onClick={() => setActiveTab("untagged")}
            />
          )}
        </div>
        <div className="relative">
          {isPremiumMasked ? (
            <PremiumGate variant="card">
              <KpiCard
                title="Spiking"
                count={stats.spikingCount}
                cost={stats.spikingCost}
                icon={TrendingUp}
                tone="info"
                label="Cost at Risk"
                isActive={activeTab === "spiking"}
                onClick={() => setActiveTab("spiking")}
              />
            </PremiumGate>
          ) : (
            <KpiCard
              title="Spiking"
              count={stats.spikingCount}
              cost={stats.spikingCost}
              icon={TrendingUp}
              tone="info"
              label="Cost at Risk"
              isActive={activeTab === "spiking"}
              onClick={() => setActiveTab("spiking")}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-light)] bg-white p-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex rounded-xl border border-[var(--border-light)] bg-[var(--bg-soft)] p-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              ["all", "untagged", "spiking"].includes(activeTab)
                ? "bg-white text-[var(--brand-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab("zombie")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === "zombie"
                ? "bg-white text-[var(--brand-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Cleanup
          </button>
        </div>

        {["all", "untagged", "spiking"].includes(activeTab) && (
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <div className="relative flex-1 md:w-72">
              {isPremiumMasked ? (
                <PremiumGate variant="inlineBadge">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchTerm}
                      readOnly
                      className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] py-2 pl-9 pr-4 text-xs text-[var(--text-secondary)]"
                    />
                  </div>
                </PremiumGate>
              ) : (
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    size={14}
                  />
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchTerm}
                      onChange={(e: ResourceInputChange) => setSearchTerm(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-light)] bg-white py-2 pl-9 pr-4 text-xs text-[var(--text-primary)] outline-none transition-all focus:border-emerald-200 focus:ring-2 focus:ring-emerald-100"
                    />
                </div>
              )}
            </div>

            <div className="flex rounded-xl border border-[var(--border-light)] bg-[var(--bg-soft)] p-1">
              <button
                onClick={() => setGrouping("none")}
                className={`rounded-lg px-3 py-1 text-[10px] font-bold transition-all ${
                  grouping === "none"
                    ? "bg-white text-[var(--brand-primary)] shadow-sm"
                    : "text-[var(--text-muted)]"
                }`}
                title="List View"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setGrouping("service")}
                className={`rounded-lg px-3 py-1 text-[10px] font-bold transition-all ${
                  grouping === "service"
                    ? "bg-white text-[var(--brand-primary)] shadow-sm"
                    : "text-[var(--text-muted)]"
                }`}
                title="Group by Service"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="min-h-[460px]">
        {["all", "untagged", "spiking"].includes(activeTab) && (
          <div className="relative overflow-hidden rounded-xl border border-[var(--border-light)] bg-white shadow-sm">
            {isGatedTab ? (
              <PremiumGate variant="full" minHeight="100%">
                <div className="relative max-h-[68vh] overflow-auto">
                  {grouping === "none" ? (
                    <ResourceTableView
                      rows={filteredData}
                      isPremiumMasked={isPremiumMasked}
                      onRowClick={setSelectedResource}
                      flaggedResources={flaggedResources}
                    />
                  ) : (
                    <GroupedListView
                      groupedData={groupedData}
                      isPremiumMasked={isPremiumMasked}
                      onRowClick={setSelectedResource}
                    />
                  )}
                </div>
              </PremiumGate>
            ) : (
              <div className="relative max-h-[68vh] overflow-auto">
                {grouping === "none" ? (
                  <ResourceTableView
                    rows={filteredData}
                    isPremiumMasked={isPremiumMasked}
                    onRowClick={setSelectedResource}
                    flaggedResources={flaggedResources}
                  />
                ) : (
                  <GroupedListView
                    groupedData={groupedData}
                    isPremiumMasked={isPremiumMasked}
                    onRowClick={setSelectedResource}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "zombie" && (
          <div className="relative min-h-[380px] overflow-hidden rounded-xl border border-[var(--border-light)] bg-white shadow-sm">
            {isZombieGated ? (
              <PremiumGate variant="wrap">
                <ZombieListView data={inventory} onInspect={setSelectedResource} />
              </PremiumGate>
            ) : (
              <ZombieListView data={inventory} onInspect={setSelectedResource} />
            )}
          </div>
        )}
      </div>

      <InspectorDrawerView
        selectedResource={selectedResource}
        onClose={() => setSelectedResource(null)}
        flaggedResources={flaggedResources}
        onToggleFlag={onToggleFlag}
      />
    </div>
  );
};

export default ResourceInventoryView;



