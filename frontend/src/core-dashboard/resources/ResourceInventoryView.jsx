import React from "react";
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
} from "lucide-react";

import KpiCard from "./components/KpiCard";
import PremiumGate from "../common/PremiumGate";
import ResourceTableView from "./components/ResourceTable";
import GroupedListView from "./components/GroupedList";
import ZombieListView from "./components/ZombieList";
import InspectorDrawerView from "./components/InspectorDrawer";

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
}) => {
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-[#a02ff1]">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  const isGatedTab =
    isPremiumMasked && (activeTab === "untagged" || activeTab === "spiking");
  const isZombieGated = isPremiumMasked && activeTab === "zombie";

  return (
    <div className="p-0 space-y-6 text-white font-sans animate-in fade-in duration-500 relative">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Box className="text-[#a02ff1]" /> Asset Manager
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Full inventory visibility and waste detection.
          </p>
        </div>

        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#a02ff1]/10 hover:bg-[#a02ff1]/20 border border-[#a02ff1]/30 rounded-lg text-xs font-bold text-[#a02ff1] transition-all whitespace-nowrap"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Assets"
          count={stats.total}
          cost={stats.totalCost}
          icon={Server}
          color="blue"
          label="Total Spend"
          isActive={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        />
        <KpiCard
          title="Zombie Assets"
          count={stats.zombieCount}
          cost={stats.zombieCost}
          icon={Ghost}
          color="orange"
          label="Wasted Spend"
          isActive={activeTab === "zombie"}
          onClick={() => setActiveTab("zombie")}
        />
        {/* Untagged (premium KPI) */}
        <div className="relative">
          {isPremiumMasked ? (
            <PremiumGate variant="card">
              <KpiCard
                title="Untagged"
                count={stats.untaggedCount}
                cost={stats.untaggedCost}
                icon={Tag}
                color="red"
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
              color="red"
              label="Unallocated"
              isActive={activeTab === "untagged"}
              onClick={() => setActiveTab("untagged")}
            />
          )}
        </div>
        {/* Spiking (premium KPI) */}
        <div className="relative">
          {isPremiumMasked ? (
            <PremiumGate variant="card">
              <KpiCard
                title="Spiking"
                count={stats.spikingCount}
                cost={stats.spikingCost}
                icon={TrendingUp}
                color="purple"
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
              color="purple"
              label="Cost at Risk"
              isActive={activeTab === "spiking"}
              onClick={() => setActiveTab("spiking")}
            />
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-white/10 pb-4 items-center">
        <div className="flex bg-[#1a1b20] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              ["all", "untagged", "spiking"].includes(activeTab)
                ? "bg-[#a02ff1] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab("zombie")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "zombie"
                ? "bg-[#a02ff1] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Cleanup
          </button>
        </div>

        {["all", "untagged", "spiking"].includes(activeTab) && (
          <div className="flex gap-3 w-full md:w-auto">
            {/* Search (premium masked) */}
            <div className="relative flex-1 md:w-64">
              {isPremiumMasked ? (
                <PremiumGate
                  variant="inlineBadge"
                >
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchTerm}
                      readOnly
                      className="w-full pl-9 pr-4 py-2 bg-[#1a1b20] border border-white/10 rounded-xl text-xs text-white"
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
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#1a1b20] border border-white/10 rounded-xl text-xs text-white focus:border-[#a02ff1] outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex bg-[#1a1b20] rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setGrouping("none")}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                  grouping === "none"
                    ? "bg-white/10 text-white"
                    : "text-gray-400"
                }`}
                title="List View"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setGrouping("service")}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                  grouping === "service"
                    ? "bg-white/10 text-white"
                    : "text-gray-400"
                }`}
                title="Group by Service"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="min-h-[500px]">
        {["all", "untagged", "spiking"].includes(activeTab) && (
          <div className="bg-[#1a1b20] border border-white/10 rounded-xl overflow-hidden shadow-lg relative">
            {/* ✅ Correct masking: wrap the actual table/list content so it dims + blocks clicks */}
            {isGatedTab ? (
              <PremiumGate variant="full" minHeight="100%">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
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
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
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
          <div className="bg-[#1a1b20] border border-white/10 rounded-xl overflow-hidden shadow-lg relative min-h-[400px]">
            {/* ✅ Correct masking: wrap ZombieListView instead of hiding it */}
            {isZombieGated ? (
              <PremiumGate variant="wrap" >
                <ZombieListView
                  data={inventory}
                  onInspect={setSelectedResource}
                />

              </PremiumGate>
            ) : (
              <ZombieListView
                data={inventory}
                onInspect={setSelectedResource}
              />
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
