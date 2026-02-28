import { apiGet } from "../../services/http";
import type { OverviewResponse } from "./overview.types";

export const fetchOverview = async (force = false, scopeDays?: number) => {
  return apiGet<OverviewResponse>("/api/admin/overview", {
    query: {
      ...(force ? { force: "true", ts: Date.now().toString() } : {}),
      ...(scopeDays ? { recentDays: scopeDays.toString() } : {}),
    },
  });
};
