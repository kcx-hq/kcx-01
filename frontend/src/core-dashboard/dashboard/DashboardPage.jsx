import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthStore } from "../../store/Authstore";
import { useCaps } from "../../hooks/useCaps";

import VerticalSidebar from "../common/Layout/VerticalSidebar";
import Header from "../common/Layout/Header";

// components/hooks
import KeepAlive from "./components/KeepAlive";
import { ComponentLoader, SkeletonLoader } from "./components/Loaders";
import { useDashboardRoute } from "./hooks/useDashboardRoutes";
import {
  useDashboardCapabilities,
  isModuleEnabled,
  hasEndpoint,
} from "./hooks/useDashboardCapabilities";
import { useKeepAliveRegistry } from "./hooks/useKeepAliveRegistry";
import { useHeaderAnomalies } from "./hooks/useHeaderAnomalies";

// lazy views
import {
  Overview,
  DataExplorer,
  CostAnalysis,
  CostDrivers,
  ResourceInventory,
  DataQuality,
  Optimization,
  Reports,
  AccountsOwnership,
} from "./lazyViews";
import VerticalSidebarConfig from "../verticalSidebar.config.js";

const DashboardPage = () => {
  const { fetchUser, user } = useAuthStore();
  const { caps, api, loading: capsLoading, error: capsError } = useCaps();

  const route = useDashboardRoute();
  const { shouldRender } = useKeepAliveRegistry(route);
  const [isLocked, setIsLocked] = useState(false);

  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    provider: "All",
    service: "All",
    region: "All",
  });

  const handleFilterChange = useCallback((partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const memoizedFilters = useMemo(
    () => filters,
    [filters.provider, filters.service, filters.region],
  );

  const anomaliesData = useHeaderAnomalies({ api, caps, filters, route });
  const { hasAnyDashboardModule } = useDashboardCapabilities(caps);

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      setIsLocked(!user?.is_premium);
      setLoading(false);
    };
    init();
  }, [fetchUser]);

  const pageTitle = useMemo(() => {
    if (route.isDataExplorer) return "Data Explorer";
    if (route.isCostAnalysis) return "Cost Analysis";
    if (route.isCostDrivers) return "Cost Drivers";
    if (route.isResources) return "Resource Inventory";
    if (route.isDataQuality) return "Data Quality Hub";
    if (route.isOptimization) return "Optimization";
    if (route.isReports) return "Reports";
    if (route.isAccounts) return "Account Ownership";
    return "Overview";
  }, [route]);

  if (capsLoading || loading) return <SkeletonLoader />;

  if (capsError || !caps) {
    return (
      <div className="min-h-screen bg-[#0f0f11] text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-gray-400">
            Unable to load capabilities. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  if (!hasAnyDashboardModule) {
    return (
      <div className="min-h-screen bg-[#0f0f11] text-white font-sans">
        <VerticalSidebar
          config={VerticalSidebarConfig}
          isLocked={isLocked}
          isPremiumUser={!isLocked}
        />
        <Header title="Dashboard" />
        <main className="ml-[72px] lg:ml-[240px] pt-[64px] min-h-screen"></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white font-sans">
      <VerticalSidebar
        config={VerticalSidebarConfig}
        isLocked={isLocked}
        isPremiumUser={!isLocked}
      />

      <Header
        title={pageTitle}
        anomalies={anomaliesData.list}
        anomaliesCount={anomaliesData.count}
      />

      <main className="ml-[72px] lg:ml-[240px] pt-[64px] min-h-screen relative transition-all duration-300">
        <div className="p-4 lg:p-6 space-y-4 max-w-[1920px] mx-auto h-full">
          <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none -z-10 ml-[72px] lg:ml-[240px] mt-[64px] transition-all duration-300" />

          <Suspense fallback={<ComponentLoader />}>
            {shouldRender(route.isDataExplorer, "DataExplorer") &&
              isModuleEnabled(caps, "overview") &&
              hasEndpoint(caps, "overview", "dataExplorer") && (
                <KeepAlive isActive={route.isDataExplorer}>
                  <DataExplorer
                    filters={memoizedFilters}
                    api={api}
                    caps={caps}
                  />
                </KeepAlive>
              )}

            {shouldRender(route.isCostAnalysis, "CostAnalysis") &&
              isModuleEnabled(caps, "costAnalysis") && (
                <KeepAlive isActive={route.isCostAnalysis}>
                  <CostAnalysis
                    filters={memoizedFilters}
                    onFilterChange={handleFilterChange}
                    api={api}
                    caps={caps}
                  />
                </KeepAlive>
              )}

            {shouldRender(route.isCostDrivers, "CostDrivers") &&
              isModuleEnabled(caps, "costDrivers") && (
                <KeepAlive isActive={route.isCostDrivers}>
                  <CostDrivers
                    filters={memoizedFilters}
                    onFilterChange={handleFilterChange}
                    api={api}
                    caps={caps}
                  />
                </KeepAlive>
              )}

            {shouldRender(route.isResources, "ResourceInventory") &&
              isModuleEnabled(caps, "resources") && (
                <KeepAlive isActive={route.isResources}>
                  <ResourceInventory
                    filters={memoizedFilters}
                    api={api}
                    caps={caps}
                  />
                </KeepAlive>
              )}

            {shouldRender(route.isDataQuality, "DataQuality") &&
              isModuleEnabled(caps, "dataQuality") && (
                <KeepAlive isActive={route.isDataQuality}>
                  <DataQuality
                    filters={memoizedFilters}
                    api={api}
                    caps={caps}
                  />
                </KeepAlive>
              )}

            {shouldRender(route.isOptimization, "Optimization") &&
              isModuleEnabled(caps, "optimization") && (
                <KeepAlive isActive={route.isOptimization}>
                  <Optimization
                    filters={memoizedFilters}
                    api={api}
                    caps={caps}
                  />
                </KeepAlive>
              )}

            {shouldRender(route.isReports, "Reports") &&
              isModuleEnabled(caps, "reports") && (
                <KeepAlive isActive={route.isReports}>
                  <Reports filters={memoizedFilters} api={api} caps={caps} />
                </KeepAlive>
              )}

            {shouldRender(route.isAccounts, "AccountsOwnership") &&
              isModuleEnabled(caps, "governance") && (
                <KeepAlive isActive={route.isAccounts}>
                  <AccountsOwnership
                    filters={memoizedFilters}
                    api={api}
                    caps={caps}
                  />
                </KeepAlive>
              )}

            {shouldRender(route.isOverview, "Overview") &&
              isModuleEnabled(caps, "overview") && (
                <KeepAlive isActive={route.isOverview}>
                  <Overview
                    filters={memoizedFilters}
                    onFilterChange={handleFilterChange}
                    api={api}
                    caps={caps}
                  />
                </KeepAlive>
              )}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
