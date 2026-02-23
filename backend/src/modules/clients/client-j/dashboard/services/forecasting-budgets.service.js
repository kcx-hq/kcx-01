import { clientJDashboardService } from "../dashboard.service.js";

export const getClientJForecastingBudgets = (params) =>
  clientJDashboardService.getForecastingBudgets(params);

