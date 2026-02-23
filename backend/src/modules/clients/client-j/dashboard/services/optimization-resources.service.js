import { clientJDashboardService } from "../dashboard.service.js";

export const getClientJOptimizationResources = (params) =>
  clientJDashboardService.getOptimizationResources(params);

