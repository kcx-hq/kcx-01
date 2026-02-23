import { clientJDashboardService } from "../dashboard.service.js";

export const getClientJDataExplorer = (params) =>
  clientJDashboardService.getDataExplorer(params);

export const exportClientJDataExplorerCsv = (params) =>
  clientJDashboardService.exportDataExplorerCsv(params);

