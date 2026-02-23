import { clientJDashboardService } from "../dashboard.service.js";

export const getClientJGovernanceDataHealth = (params) =>
  clientJDashboardService.getGovernanceDataHealth(params);

