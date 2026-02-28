import { buildUrl } from "../../services/http";
import type { OverviewResponse } from "./overview.types";

export const fetchOverview = async (force = false, scopeDays?: number) => {
  const url = buildUrl("/admin/overview");
  if (force) {
    url.searchParams.set("force", "true");
    url.searchParams.set("ts", Date.now().toString());
  }
  if (scopeDays) {
    url.searchParams.set("recentDays", scopeDays.toString());
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load overview");
  }

  return (await res.json()) as OverviewResponse;
};
