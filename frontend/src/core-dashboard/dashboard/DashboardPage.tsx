import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "../../store/Authstore";
import { useCaps } from "../../hooks/useCaps";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import VerticalSidebar from "../common/Layout/VerticalSidebar";
import Header from "../common/Layout/Header";

import KeepAlive from "./components/KeepAlive";
import { ComponentLoader, SkeletonLoader } from "./components/Loaders";
import ModuleErrorBoundary from "./components/ModuleErrorBoundary";
import { useDashboardRoute } from "./hooks/useDashboardRoutes";
import {
  useDashboardCapabilities,
  isModuleEnabled,
  hasEndpoint,
} from "./hooks/useDashboardCapabilities";
import { useKeepAliveRegistry } from "./hooks/useKeepAliveRegistry";
import { useHeaderAnomalies } from "./hooks/useHeaderAnomalies";

import {
  Overview,
  DataExplorer,
  CostAnalysis,
  CostDrivers,
  DataQuality,
  ForecastingBudgets,
  AlertsIncidents,
  Optimization,
  Reports,
  AllocationUnitEconomics,
} from "./lazyViews";
import VerticalSidebarConfig from "../verticalSidebar.config";

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasHandledInitialRedirect = useRef(false);
  const { fetchUser } = useAuthStore();
  const { caps, api, loading: capsLoading, error: capsError } = useCaps();

  const route = useDashboardRoute();
  const { shouldRender } = useKeepAliveRegistry(route);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(() => ({
    provider: searchParams.get("provider") || "All",
    service: searchParams.get("service") || "All",
    region: searchParams.get("region") || "All",
  }));


  const handleFilterChange = useCallback((partial) => {
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      const nextParams = new URLSearchParams(searchParams);

      ["provider", "service", "region"].forEach((k) => {
        const value = next[k];
        if (!value || value === "All") nextParams.delete(k);
        else nextParams.set(k, value);
      });

      setSearchParams(nextParams, { replace: true });
      return next;
    });
  }, [searchParams, setSearchParams]);

  const memoizedFilters = useMemo(
    () => filters,
    [filters.provider, filters.service, filters.region],
  );

  useEffect(() => {
    setFilters({
      provider: searchParams.get("provider") || "All",
      service: searchParams.get("service") || "All",
      region: searchParams.get("region") || "All",
    });
  }, [searchParams]);

  const anomaliesData = useHeaderAnomalies({ api, caps, filters, route });
  const { hasAnyDashboardModule } = useDashboardCapabilities(caps);

  useEffect(() => {
    const init = async () => {
      const result = await fetchUser();
      const currentUser = result?.user ?? useAuthStore.getState()?.user;
      setIsLocked(!currentUser?.is_premium);
      setLoading(false);
    };
    init();
  }, [fetchUser]);

  // On hard reload, always land on Overview first.
  useEffect(() => {
    if (hasHandledInitialRedirect.current) return;
    hasHandledInitialRedirect.current = true;

    const navEntry = performance.getEntriesByType("navigation")?.[0];
    const isReload = navEntry?.type === "reload";
    const isDashboardChildRoute =
      location.pathname.startsWith("/dashboard/") && location.pathname !== "/dashboard";

    if (isReload && isDashboardChildRoute) {
      navigate("/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  const pageTitle = useMemo(() => {
    if (route.isDataExplorer) return "Data Explorer";
    if (route.isCostAnalysis) return "Cost Analysis";
    if (route.isCostDrivers) return "Cost Drivers";
    if (route.isDataQuality) return "Governance & Data Quality";
    if (route.isForecastingBudgets) return "Forecasting & Budgets";
    if (route.isAlertsIncidents) return "Alerts & Incidents";
    if (route.isOptimization) return "Optimization";
    if (route.isReports) return "Reports";
    if (route.isAllocationUnitEconomics) return "Allocation & Unit Economics";
    return "Overview";
  }, [route]);

  const withBoundary = useCallback((moduleName, node) => (
    <ModuleErrorBoundary moduleName={moduleName}>
      {node}
    </ModuleErrorBoundary>
  ), []);

  if (capsLoading || loading) return <SkeletonLoader />;

  if (capsError || !caps) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-main)] p-6">
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-800">Failed to Load Dashboard</h2>
          <p className="mb-8 leading-relaxed text-slate-500">
            We encountered an issue loading your account capabilities. This might be a temporary connection issue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#007758] px-6 py-3 font-semibold text-white transition-all hover:bg-[#005c45]"
          >
            <RefreshCw size={18} /> Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg-main)] font-sans text-slate-900">
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

      <main className="relative ml-[72px] min-h-screen pt-[64px] transition-all duration-300 lg:ml-[240px]">
        <div className="pointer-events-none fixed inset-0 -z-10 ml-[72px] bg-[var(--bg-main)] lg:ml-[240px] mt-[64px]">
          <div className="absolute left-0 top-0 h-[400px] w-full bg-gradient-to-b from-white/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto h-full max-w-[1920px] p-3 sm:p-4 md:p-6 lg:p-8">
          <Suspense fallback={<ComponentLoader />}>
            {!hasAnyDashboardModule ? (
              <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                <h3 className="text-xl font-bold text-slate-700">No Modules Enabled</h3>
                <p className="mt-2 text-slate-500">Please contact support to enable dashboard features for your account.</p>
              </div>
            ) : (
              <>
                {shouldRender(route.isDataExplorer, "DataExplorer") &&
                isModuleEnabled(caps, "overview") &&
                hasEndpoint(caps, "overview", "dataExplorer") && (
                  withBoundary(
                    "Data Explorer",
                    <KeepAlive isActive={route.isDataExplorer}>
                      <DataExplorer filters={memoizedFilters} api={api} caps={caps} />
                    </KeepAlive>
                  )
                )}

                {shouldRender(route.isCostAnalysis, "CostAnalysis") &&
                isModuleEnabled(caps, "costAnalysis") && (
                  withBoundary(
                    "Cost Analysis",
                    <KeepAlive isActive={route.isCostAnalysis}>
                      <CostAnalysis
                        filters={memoizedFilters}
                        onFilterChange={handleFilterChange}
                        api={api}
                        caps={caps}
                      />
                    </KeepAlive>
                  )
                )}

                {shouldRender(route.isCostDrivers, "CostDrivers") &&
                isModuleEnabled(caps, "costDrivers") && (
                  withBoundary(
                    "Cost Drivers",
                    <KeepAlive isActive={route.isCostDrivers}>
                      <CostDrivers
                        filters={memoizedFilters}
                        onFilterChange={handleFilterChange}
                        api={api}
                        caps={caps}
                      />
                    </KeepAlive>
                  )
                )}

                {shouldRender(route.isDataQuality, "DataQuality") &&
                isModuleEnabled(caps, "dataQuality") && (
                  withBoundary(
                    "Data Quality",
                    <KeepAlive isActive={route.isDataQuality}>
                      <DataQuality filters={memoizedFilters} api={api} caps={caps} />
                    </KeepAlive>
                  )
                )}

                {shouldRender(route.isForecastingBudgets, "ForecastingBudgets") &&
                isModuleEnabled(caps, "forecastingBudgets") && (
                  withBoundary(
                    "Forecasting & Budgets",
                    <KeepAlive isActive={route.isForecastingBudgets}>
                      <ForecastingBudgets filters={memoizedFilters} api={api} caps={caps} />
                    </KeepAlive>
                  )
                )}

                {shouldRender(route.isAlertsIncidents, "AlertsIncidents") &&
                isModuleEnabled(caps, "alertsIncidents") && (
                  withBoundary(
                    "Alerts & Incidents",
                    <KeepAlive isActive={route.isAlertsIncidents}>
                      <AlertsIncidents filters={memoizedFilters} api={api} caps={caps} />
                    </KeepAlive>
                  )
                )}

                {shouldRender(route.isOptimization, "Optimization") &&
                isModuleEnabled(caps, "optimization") && (
                  withBoundary(
                    "Optimization",
                    <KeepAlive isActive={route.isOptimization}>
                      <Optimization filters={memoizedFilters} api={api} caps={caps} />
                    </KeepAlive>
                  )
                )}

                {shouldRender(route.isReports, "Reports") &&
                isModuleEnabled(caps, "reports") && (
                  withBoundary(
                    "Reports",
                    <KeepAlive isActive={route.isReports}>
                      <Reports filters={memoizedFilters} api={api} caps={caps} />
                    </KeepAlive>
                  )
                )}

                {shouldRender(route.isAllocationUnitEconomics, "AllocationUnitEconomics") &&
                (isModuleEnabled(caps, "unitEconomics") || isModuleEnabled(caps, "governance")) && (
                  withBoundary(
                    "Allocation & Unit Economics",
                    <KeepAlive isActive={route.isAllocationUnitEconomics}>
                      <AllocationUnitEconomics filters={memoizedFilters} api={api} caps={caps} />
                    </KeepAlive>
                  )
                )}

                {shouldRender(route.isOverview, "Overview") &&
                isModuleEnabled(caps, "overview") && (
                  withBoundary(
                    "Overview",
                    <KeepAlive isActive={route.isOverview}>
                      <Overview onFilterChange={handleFilterChange} api={api} caps={caps} />
                    </KeepAlive>
                  )
                )}
              </>
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
