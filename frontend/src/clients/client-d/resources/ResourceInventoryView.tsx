// frontend/clients/client-d/dashboards/resources/ResourceInventoryView.jsx
import React from "react";
import type { ChangeEvent } from "react";
import {
  Box,
  Download,
  Search,
  List,
  LayoutGrid,
  Loader2,
  Server,
  Ghost,
  Tag,
  TrendingUp,
  Crown,
} from "lucide-react";

import KpiCard from "../../../core-dashboard/resources/components/KpiCard";
import PremiumGate from "../../../core-dashboard/common/PremiumGate";
import ResourceTableView from "../../../core-dashboard/resources/components/ResourceTable";
import GroupedListView from "../../../core-dashboard/resources/components/GroupedList";
import ZombieListView from "../../../core-dashboard/resources/components/ZombieList";
import InspectorDrawerView from "../../../core-dashboard/resources/components/InspectorDrawer";
import type {
  EmptyStateProps,
  ResourceInventoryViewProps,
  ResourceTab,
  StatPillProps,
  ToneMap,
} from "./types";

const EmptyState = ({ title, subtitle }: EmptyStateProps) => (
  <div className="py-16 flex flex-col items-center justify-center text-center">
    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
      <Box className="text-gray-500" />
    </div>
    <div className="text-white font-bold">{title}</div>
    <div className="text-xs text-gray-500 mt-1 max-w-md">{subtitle}</div>
  </div>
);

const StatPill = ({ icon: Icon, label, value, tone = "mint" }: StatPillProps) => {
  const toneMap: ToneMap = {
    mint: "from-emerald-50 to-white border-emerald-200 text-emerald-700",
    gray: "from-[#1b1c22] to-[#14151a] border-white/10 text-gray-200",
    green: "from-[#0f2a22]/60 to-[#14151a] border-emerald-400/20 text-emerald-200",
  };

  return (
    <div
      className={[
        "rounded-2xl border p-4 shadow-lg bg-gradient-to-r",
        toneMap[tone] || toneMap.gray,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-black/30 border border-white/10">
          <Icon size={16} className="opacity-90" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] tracking-widest uppercase font-bold opacity-80">
            {label}
          </div>
          <div className="text-sm font-extrabold mt-1">{value}</div>
        </div>
      </div>
    </div>
  );
};

const ResourceInventoryView = ({
  loading,
  isPremiumMasked,

  // state
  searchTerm,
  activeTab,
  grouping,
  selectedResource,

  // data
  stats,
  filteredData,
  groupedData,
  inventory,
  flaggedResources,

  // handlers
  onExportCSV,
  setSearchTerm,
  setActiveTab,
  setGrouping,
  setSelectedResource,
  onToggleFlag,
}: ResourceInventoryViewProps) => {
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-[#23a282]">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  const isGatedTab =
    isPremiumMasked && (activeTab === "untagged" || activeTab === "spiking");
  const isZombieGated = isPremiumMasked && activeTab === "zombie";

  const showingLabel =
    activeTab === "all"
      ? "Inventory"
      : activeTab === "zombie"
        ? "Cleanup"
        : activeTab === "untagged"
          ? "Untagged"
          : activeTab === "spiking"
            ? "Spiking"
            : "Inventory";

  const hasRows =
    activeTab === "zombie"
      ? Array.isArray(inventory) && inventory.length > 0
      : Array.isArray(filteredData) && filteredData.length > 0;

  return (
    <div className="p-4 md:p-6 bg-[#0f0f11] text-white font-sans">
      {/* OUTER SHELL */}
      <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-[#15161b] to-[#0f0f11] shadow-[0_0_80px_rgba(0,0,0,0.55)] overflow-hidden">
        {/* HEADER */}
        <div className="p-6 md:p-7 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#23a282]/10 border border-[#23a282]/25 flex items-center justify-center">
                  <Box className="text-[#23a282]" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-extrabold tracking-tight">
                    Asset Manager
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">
                    Inventory visibility + waste signals (Client-D layout)
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onExportCSV}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#23a282]/10 hover:bg-[#23a282]/20 border border-[#23a282]/30 text-[#86efac] font-bold text-xs transition"
            >
              <Download size={14} /> CSV
            </button>
          </div>

          {/* STATUS PILLS */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <StatPill
              icon={Server}
              tone="mint"
              label="Inventory Loaded"
              value={`${stats?.total ?? 0} assets`}
            />
            <StatPill
              icon={Tag}
              tone="gray"
              label="Tagging Status"
              value={`${stats?.untaggedCount ?? 0} untagged`}
            />
            <StatPill
              icon={TrendingUp}
              tone="green"
              label="Untagged Cost"
              value={`Credit / Adjustment: ${Number(stats?.untaggedCost ?? 0) < 0 ? "-" : ""}$${Math.abs(
                Number(stats?.untaggedCost ?? 0)
              ).toFixed(2)}`}
            />
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 md:p-7 space-y-6">
          {/* OVERVIEW KPI GRID */}
          <div>
            <div className="text-[11px] tracking-widest uppercase font-bold text-gray-500 mb-3">
              Overview
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <KpiCard
                title="Total Assets"
                count={stats.total}
                cost={stats.totalCost}
                icon={Server}
                label="Total Spend"
                isActive={activeTab === "all"}
                onClick={() => setActiveTab("all")}
              />

              <KpiCard
                title="Cleanup"
                count={stats.zombieCount || 0}
                cost={stats.zombieCost || 0}
                icon={Ghost}
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
                      count={stats.spikingCount || 0}
                      cost={stats.spikingCost || 0}
                      icon={TrendingUp}
                      label="Cost at Risk"
                      isActive={activeTab === "spiking"}
                      onClick={() => setActiveTab("spiking")}
                    />
                  </PremiumGate>
                ) : (
                  <KpiCard
                    title="Spiking"
                    count={stats.spikingCount || 0}
                    cost={stats.spikingCost || 0}
                    icon={TrendingUp}
                    label="Cost at Risk"
                    isActive={activeTab === "spiking"}
                    onClick={() => setActiveTab("spiking")}
                  />
                )}
              </div>
            </div>
          </div>

          {/* TABS + TABLE WRAPPER (NO OVERLAP) */}
          <div className="rounded-3xl border border-white/10 bg-[#0f0f11]/40 overflow-hidden">
            {/* Tabs row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-2">
                {(["all", "zombie", "untagged", "spiking"] as ResourceTab[]).map((key) => {
                  const label =
                    key === "all"
                      ? "Inventory"
                      : key === "zombie"
                      ? "Cleanup"
                      : key === "untagged"
                      ? "Untagged"
                      : "Spiking";

                  const gated =
                    isPremiumMasked && (key === "untagged" || key === "spiking" || key === "zombie");
                  const isActive = activeTab === key;

                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={[
                        "relative px-4 py-2 rounded-2xl text-xs font-extrabold transition",
                        isActive
                          ? "bg-[#23a282] text-white shadow-[0_0_18px_rgba(35,162,130,0.35)]"
                          : "bg-white/5 text-gray-300 hover:bg-white/10",
                      ].join(" ")}
                    >
                      {gated && (
                        <span className="absolute -top-1 -right-1">
                          <Crown size={12} className="text-yellow-400" />
                        </span>
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3">
                <div className="text-xs text-gray-500">
                  Showing:{" "}
                  <span className="text-gray-200 font-semibold">{showingLabel}</span>
                </div>

                {["all", "untagged", "spiking"].includes(activeTab) && (
                  <>
                    {/* Search */}
                    <div className="relative w-full md:w-72">
                      {isPremiumMasked ? (
                        <PremiumGate variant="inlineBadge">
                          <div className="relative">
                            <Search
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                              size={14}
                            />
                            <input
                              value={searchTerm}
                              readOnly
                              placeholder="Search resources..."
                              className="w-full pl-9 pr-4 py-2 bg-black/30 border border-white/10 rounded-2xl text-xs text-white"
                            />
                          </div>
                        </PremiumGate>
                      ) : (
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                            size={14}
                          />
                          <input
                            value={searchTerm}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setSearchTerm(e.target.value)
                            }
                            placeholder="Search resources..."
                            className="w-full pl-9 pr-4 py-2 bg-black/30 border border-white/10 rounded-2xl text-xs text-white focus:border-[#23a282] outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Grouping */}
                    <div className="flex bg-black/30 rounded-2xl p-1 border border-white/10">
                      <button
                        onClick={() => setGrouping("none")}
                        className={[
                          "px-3 py-2 rounded-xl text-[10px] font-extrabold transition",
                          grouping === "none" ? "bg-white/10 text-white" : "text-gray-400",
                        ].join(" ")}
                        title="List View"
                      >
                        <List size={14} />
                      </button>
                      <button
                        onClick={() => setGrouping("service")}
                        className={[
                          "px-3 py-2 rounded-xl text-[10px] font-extrabold transition",
                          grouping === "service" ? "bg-white/10 text-white" : "text-gray-400",
                        ].join(" ")}
                        title="Group by Service"
                      >
                        <LayoutGrid size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Table / Lists */}
            <div className="relative">
              {activeTab !== "zombie" && (
                <>
                  {isGatedTab ? (
                    <PremiumGate variant="full" minHeight="420px">
                      <div className="max-h-[620px] overflow-auto">
                        {hasRows ? (
                          grouping === "none" ? (
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
                          )
                        ) : (
                          <EmptyState
                            title="No matching resources"
                            subtitle="Try changing tabs, clearing search, or adjusting filters."
                          />
                        )}
                      </div>
                    </PremiumGate>
                  ) : (
                    <div className="max-h-[620px] overflow-auto">
                      {hasRows ? (
                        grouping === "none" ? (
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
                        )
                      ) : (
                        <EmptyState
                          title={`No rows in ${showingLabel}`}
                          subtitle="There’s nothing to show for this tab right now."
                        />
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === "zombie" && (
                <>
                  {isZombieGated ? (
                    <PremiumGate variant="wrap">
                      <div className="max-h-[620px] overflow-auto">
                        {hasRows ? (
                          <ZombieListView data={inventory} onInspect={setSelectedResource} />
                        ) : (
                          <EmptyState
                            title="No zombie assets detected"
                            subtitle="Looks clean. Check other tabs for inventory signals."
                          />
                        )}
                      </div>
                    </PremiumGate>
                  ) : (
                    <div className="max-h-[620px] overflow-auto">
                      {hasRows ? (
                        <ZombieListView data={inventory} onInspect={setSelectedResource} />
                      ) : (
                        <EmptyState
                          title="No zombie assets detected"
                          subtitle="Looks clean. Check other tabs for inventory signals."
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <InspectorDrawerView
          selectedResource={selectedResource}
          onClose={() => setSelectedResource(null)}
          flaggedResources={flaggedResources}
          onToggleFlag={onToggleFlag}
        />
      </div>
    </div>
  );
};

export default ResourceInventoryView;
