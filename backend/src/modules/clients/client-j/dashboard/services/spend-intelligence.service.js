import { clientJDashboardService } from "../dashboard.service.js";

export const getClientJSpendIntelligence = (params) =>
  clientJDashboardService.getSpendIntelligence(params);

