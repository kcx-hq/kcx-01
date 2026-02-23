import { clientJDashboardService } from "../dashboard.service.js";

export const getClientJReports = (params) =>
  clientJDashboardService.getReports(params);

