import { clientJDashboardService } from "../dashboard.service.js";

export const getClientJAllocationChargeback = (params) =>
  clientJDashboardService.getAllocationChargeback(params);

