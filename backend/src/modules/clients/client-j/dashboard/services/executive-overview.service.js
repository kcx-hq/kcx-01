import { clientJDashboardService } from "../dashboard.service.js";

export const getClientJExecutiveOverview = (params) =>
  clientJDashboardService.getExecutiveOverview(params);

