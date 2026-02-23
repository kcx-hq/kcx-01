import { clientJDashboardService } from "../dashboard.service.js";

export const getClientJCommitmentsRates = (params) =>
  clientJDashboardService.getCommitmentsRates(params);

