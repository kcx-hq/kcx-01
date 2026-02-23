import { clientJDashboardService } from "../dashboard.service.js";

export const getClientJFilters = (params) => clientJDashboardService.getFilters(params);

