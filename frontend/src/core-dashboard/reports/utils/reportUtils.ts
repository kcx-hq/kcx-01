import type { DashboardFilters } from "../../dashboard/types";
import type { ReportColor } from "../types";

export const buildReportParams = (filters: Partial<DashboardFilters> = {}) => {
  const params: Partial<DashboardFilters> = {};
  if (filters?.provider && filters.provider !== "All") params.provider = filters.provider;
  if (filters?.service && filters.service !== "All") params.service = filters.service;
  if (filters?.region && filters.region !== "All") params.region = filters.region;
  return params;
};

export const formatPeriod = (dateString: string | null | undefined) => {
  if (!dateString) return "Current Period";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "Current Period";
  }
};

export const getColorClasses = (color: ReportColor) => {
  const colors: Record<ReportColor, string> = {
    blue: "bg-sky-50 border-sky-200 text-sky-700",
    green: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    teal: "bg-teal-50 border-teal-200 text-teal-700",
    mint: "bg-emerald-50 border-emerald-200 text-emerald-700",
    yellow: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return colors[color] || colors.green;
};



