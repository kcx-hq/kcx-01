import React, { useMemo, useState, useCallback } from "react";
import { useAuthStore } from "../../store/Authstore";
import { useOptimizationData } from "./hooks/useOptimizationData";
import { OptimizationView } from "./OptimizationView";

export default function Optimization({ filters: parentFilters = {}, api, caps }) {
  const { user } = useAuthStore();
  const isMasked = !user?.is_premium; // NOT premium => masked

  const [activeTab, setActiveTab] = useState("opportunities");
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);

  const [idleFilter, setIdleFilter] = useState("all");
  const [idleSort, setIdleSort] = useState("savings-desc");
  const [idleSearch, setIdleSearch] = useState("");

  const { optimizationData, loading, error, isRefreshing, refetch } = useOptimizationData({
    api,
    caps,
    parentFilters,
  });

  const toggleExpand = useCallback((id) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const filteredIdleResources = useMemo(() => {
    if (!optimizationData?.idleResources) return [];
    let filtered = [...optimizationData.idleResources];

    if (idleSearch) {
      const searchLower = idleSearch.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(searchLower) ||
          r.type?.toLowerCase().includes(searchLower) ||
          r.region?.toLowerCase().includes(searchLower)
      );
    }

    if (idleFilter === "prod") filtered = filtered.filter((r) => r.risk === "Prod");
    if (idleFilter === "non-prod") filtered = filtered.filter((r) => r.risk === "Non-prod");

    return [...filtered].sort((a, b) => {
      switch (idleSort) {
        case "savings-desc":
          return (b.savings || 0) - (a.savings || 0);
        case "savings-asc":
          return (a.savings || 0) - (b.savings || 0);
        case "days-desc":
          return (b.daysIdle || 0) - (a.daysIdle || 0);
        case "days-asc":
          return (a.daysIdle || 0) - (b.daysIdle || 0);
        default:
          return 0;
      }
    });
  }, [optimizationData, idleFilter, idleSort, idleSearch]);

  return (
    <OptimizationView
      isMasked={isMasked}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      expandedItems={expandedItems}
      toggleExpand={toggleExpand}
      selectedInsight={selectedInsight}
      setSelectedInsight={setSelectedInsight}
      selectedResource={selectedResource}
      setSelectedResource={setSelectedResource}
      idleFilter={idleFilter}
      setIdleFilter={setIdleFilter}
      idleSort={idleSort}
      setIdleSort={setIdleSort}
      idleSearch={idleSearch}
      setIdleSearch={setIdleSearch}
      filteredIdleResources={filteredIdleResources}
      optimizationData={optimizationData}
      loading={loading}
      error={error}
      isRefreshing={isRefreshing}
      onRetry={refetch}
    />
  );
}
