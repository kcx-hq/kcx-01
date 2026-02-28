import { buildUrl } from "../../services/http";
import type {
  AdminActivityFilters,
  AdminActivityListResponse,
} from "./activity.types";

export const fetchAdminActivityLogs = async (
  params: Record<string, string | number | undefined>
) => {
  const url = buildUrl("/admin/activity-logs/internal", params);
  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load activity logs");
  }

  return (await res.json()) as AdminActivityListResponse;
};

export const fetchAdminActivityFilters = async () => {
  const url = buildUrl("/admin/activity-logs/filters");
  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load filters");
  }

  return (await res.json()) as AdminActivityFilters;
};
