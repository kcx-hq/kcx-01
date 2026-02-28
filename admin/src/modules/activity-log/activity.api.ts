import { apiGet } from "../../services/http";
import type {
  AdminActivityFilters,
  AdminActivityListResponse,
} from "./activity.types";

export const fetchAdminActivityLogs = async (
  params: Record<string, string | number | undefined>
) => {
  return apiGet<AdminActivityListResponse>("/api/admin/activity-logs/internal", {
    query: params,
  });
};

export const fetchAdminActivityFilters = async () => {
  return apiGet<AdminActivityFilters>("/api/admin/activity-logs/filters");
};
