import { clientJDashboardService } from "../dashboard.service.js";

export const getClientJUnitEconomics = (params) =>
  clientJDashboardService.getUnitEconomics(params);

