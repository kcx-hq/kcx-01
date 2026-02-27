import { Suspense } from "react";
import ComponentLoader from "../layout/ComponentLoader";
import KeepAlive from "../Keep-alive/KeepAlive";
import * as Views from "../views/lazyViews";
import { isModuleEnabled } from "../utils/capsUtils";
import type { ApiClient, Capabilities } from "../../../../services/apiClient";
import type { ClientCDashboardRoutes } from "./useDashboardRoutings";

interface DashboardRouterProps {
  routes: ClientCDashboardRoutes;
  api: ApiClient | null;
  caps: Capabilities | null;
}

const DashboardRouter = ({ routes, api, caps }: DashboardRouterProps) => {

  return (
    <Suspense fallback={<ComponentLoader />}>
      {routes.isOverview && isModuleEnabled(caps, "overview") && (
        <KeepAlive isActive>
          <Views.Overview api={api} caps={caps} />
        </KeepAlive>
      )}
      {routes.isDataExplorer && isModuleEnabled(caps, "dataExplorer") && (
        <KeepAlive isActive>
          <Views.DataExplorer api={api} caps={caps} />
        </KeepAlive>
      )}
      {routes.isCostAnalysis && isModuleEnabled(caps, "costAnalysis") && (
        <KeepAlive isActive>
          <Views.CostAnalysis 
            api={api} 
            caps={caps} 
          />
        </KeepAlive>
      )}
      {routes.isCostDrivers && isModuleEnabled(caps, "costDrivers") && (
        <KeepAlive isActive>
          <Views.CostDrivers 
            api={api} 
            caps={caps} 
          />
        </KeepAlive>
      )}
      {routes.isResources && isModuleEnabled(caps, "resources") && (
        <KeepAlive isActive>
          <Views.ResourceInventory api={api} caps={caps}  />
        </KeepAlive>
      )}
      {routes.isDataQuality && isModuleEnabled(caps, "dataQuality") && (
        <KeepAlive isActive>
          <Views.DataQuality api={api} caps={caps} />
        </KeepAlive>
      )}
      {routes.isOptimization && isModuleEnabled(caps, "optimization") && (
        <KeepAlive isActive>
          <Views.Optimization api={api} caps={caps} />
        </KeepAlive>
      )}
      {routes.isReports && isModuleEnabled(caps, "reports") && (
        <KeepAlive isActive>
          <Views.Reports api={api} caps={caps}  />
        </KeepAlive>
      )}
      {routes.isAccounts && isModuleEnabled(caps, "governance") && (
        <KeepAlive isActive>
          <Views.AccountsOwnership api={api} caps={caps}  />
        </KeepAlive>
      )}
      {routes.isDepartmentCost && isModuleEnabled(caps, "departmentCost") && (
        <KeepAlive isActive>
          <Views.DepartmentCost api={api} caps={caps}  />
        </KeepAlive>
      )}

      {routes.isProjectTracking && isModuleEnabled(caps, "projectTracking") && (
        <KeepAlive isActive>
          <Views.ProjectTracking api={api} caps={caps}  />
        </KeepAlive>
      )}
    </Suspense>
  );
};

export default DashboardRouter;
