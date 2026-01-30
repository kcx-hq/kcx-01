// src/pages/dashboard-client-d/DashboardClientDPage.jsx
import React, {
  Suspense,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";

import VerticalSidebar from "../../../core-dashboard/common/Layout/VerticalSidebar";
import Header from "../../../core-dashboard/common/Layout/Header";

import { ComponentLoader } from "../../../core-dashboard/dashboard/components/Loaders";
import KeepAlive from "../../../core-dashboard/dashboard/components/KeepAlive";

// Client D sidebar config
import ClientDSidebarConfig from "../verticalSidebar.config.js";
import { useCaps } from "../../../hooks/useCaps.js";
import { useAuthStore } from "../../../store/Authstore";
import AccountsOwnershipContainer from "../accounts-ownership/AccountsOwnership.jsx";

// Lazy UI pages (UI only)
const Overview = React.lazy(() => import("../overview/Overview"));
const DataExplorer = React.lazy(() => import("../data-explorer/DataExplorer"));
const CostAnalysis = React.lazy(() => import("../cost-analysis/CostAnalysis"));
const CostDrivers = React.lazy(() => import("../cost-drivers/CostDrivers"));
const ResourceInventory = React.lazy(
  () => import("../resources/ResourceInventory"),
);
const DataQuality = React.lazy(() => import("../data-quality/DataQuality"));
const Optimization = React.lazy(() => import("../optimization/Optimization"));
const Reports = React.lazy(() => import("../reports/Reports"));
const AccountsOwnership = React.lazy(() => import("../accounts-ownership/AccountsOwnership"));
const UnitEconomics = React.lazy(() => import("../unit-economics/UnitEconomics"));
// OPTIONAL: only keep these if you actually have these components

// const UnitEconomics = React.lazy(() => import("../unit-economics/UnitEconomics"));

/**
 * UI-only route flags based on:
 * /client-d/dashboard/<module>
 */
function useClientDRoutes() {
  const location = useLocation();

  return useMemo(() => {
    const BASE = "/client-d/dashboard";
    const path = location.pathname;

    // remove base and leading slash => module segment
    const subPath = path.replace(BASE, "").replace(/^\/+/, "");
    const module = subPath.split("/")[0] || "overview";

    return {
      isOverview: module === "overview",
      isDataExplorer: module === "data-explorer",
      isCostAnalysis: module === "cost-analysis",
      isCostDrivers: module === "cost-drivers",
      isResources: module === "resources",
      isDataQuality: module === "data-quality",
      isOptimization: module === "optimization",
      isReports: module === "reports",
      isAccountsOwnership: module === "accountOwnership",
      isUnitEconomics: module === "unit-economics",
    };
  }, [location.pathname]);
}

const DashboardClientDPage = () => {
  const route = useClientDRoutes();
  const { fetchUser, user } = useAuthStore();
  const { caps, api, loading: capsLoading, error: capsError } = useCaps();

  useEffect(() => {
    const init = async () => {
      await fetchUser();
    };
    init();
  }, [fetchUser]);

  const pageTitle = useMemo(() => {
    if (route.isDataExplorer) return "Data Explorer";
    if (route.isCostAnalysis) return "Cost Analysis";
    if (route.isCostDrivers) return "Cost Drivers";
    if (route.isResources) return "Resources";
    if (route.isDataQuality) return "Data Quality";
    if (route.isOptimization) return "Optimization";
    if (route.isReports) return "Reports";
    if (route.isAccountsOwnership) return "Accounts Ownership";
    if (route.isUnitEconomics) return "Unit Economics";
    return "Overview";
  }, [route]);

  const [filters, setFilters] = useState({
    provider: "All",
    service: "All",
    region: "All",
  });

  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);
  
  const memoizedFilters = useMemo(
      () => filters,
      [filters.provider, filters.service, filters.region, filters.uploadId],
    );

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white font-sans">
      <VerticalSidebar
        config={ClientDSidebarConfig}
        isLocked={false}
        isPremiumUser={true}
      />

      <Header title={pageTitle} />

      <main className="ml-[72px] lg:ml-[240px] pt-[64px] min-h-screen relative transition-all duration-300">
        <div className="p-4 lg:p-6 space-y-4 max-w-[1920px] mx-auto h-full">
          <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none -z-10 ml-[72px] lg:ml-[240px] mt-[64px] transition-all duration-300" />

          <Suspense fallback={<ComponentLoader />}>
            {route.isDataExplorer && (
              <KeepAlive isActive={route.isDataExplorer}>
                <DataExplorer filters={memoizedFilters} api={api} caps={caps} />
              </KeepAlive>
            )}

            {route.isCostAnalysis && (
              <KeepAlive isActive={route.isCostAnalysis}>
                <CostAnalysis
                  onFilterChange={handleFilterChange}
                  api={api}
                  caps={caps}
                />
              </KeepAlive>
            )}

            {route.isCostDrivers && (
              <KeepAlive isActive={route.isCostDrivers}>
                <CostDrivers filters={memoizedFilters}  api={api}
                  caps={caps}/>
              </KeepAlive>
            )}

            {route.isResources && (
              <KeepAlive isActive={route.isResources}>
                <ResourceInventory filters={memoizedFilters}  api={api}
                  caps={caps} />
              </KeepAlive>
            )}

            {route.isDataQuality && (
              <KeepAlive isActive={route.isDataQuality}>
                <DataQuality 
                filters={memoizedFilters}  api={api}
                  caps={caps} />
              </KeepAlive>
            )}

            {route.isOptimization && (
              <KeepAlive isActive={route.isOptimization}>
                <Optimization filters={memoizedFilters}  api={api}
                  caps={caps} />
              </KeepAlive>
            )}

            {route.isReports && (
              <KeepAlive isActive={route.isReports}>
                <Reports filters={memoizedFilters}  api={api}
                  caps={caps} />
              </KeepAlive>
            )}

            {route.isAccountsOwnership && (
              <KeepAlive isActive={route.isAccountsOwnership}>
                <AccountsOwnership filters={memoizedFilters}  api={api}
                  caps={caps} />
              </KeepAlive>
            )}

             {route.isUnitEconomics && (
              <KeepAlive isActive={route.isUnitEconomics}>
                <UnitEconomics  filters={memoizedFilters}  api={api}
                  caps={caps} />
              </KeepAlive>
            )}

            {route.isOverview && (
              <KeepAlive isActive={route.isOverview}>
                <Overview
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

export default DashboardClientDPage;
