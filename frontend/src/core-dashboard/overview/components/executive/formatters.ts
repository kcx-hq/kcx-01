import { OverviewAnomaly } from "../../types";

export const formatUSD = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const formatPct = (value: number, digits = 1): string =>
  `${Number(value || 0).toFixed(digits)}%`;

export const formatSignedPct = (value: number, digits = 1): string => {
  const num = Number(value || 0);
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(digits)}%`;
};

export const toSafeNumber = (value: unknown): number => {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
};

export const statusChipClass = (status: string): string => {
  if (status === "Over budget") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "Watch") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

export const deltaBadgeClass = (value: number): string =>
  toSafeNumber(value) > 0
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";

export const confidenceClass = (confidence = "Medium"): string => {
  const normalized = String(confidence || "").toLowerCase();
  if (normalized === "high") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "low") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
};

export const actionStatusClass = (status = "Open"): string => {
  if (status === "Blocked") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "In progress") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

export const anomalySeverityClass = (severity = "Medium"): string => {
  const normalized = String(severity || "").toLowerCase();
  if (normalized === "critical" || normalized === "high") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (normalized === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return "N/A";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "N/A";
  return dt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
};

export const toActionStatus = (status = ""): "Open" | "Blocked" | "In progress" => {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("block")) return "Blocked";
  if (normalized.includes("progress")) return "In progress";
  return "Open";
};

export const toAnomalySeverity = (anomaly: OverviewAnomaly): string => {
  const provided = String(anomaly?.severity || "");
  if (provided) return provided;
  const impact = toSafeNumber(anomaly?.impactToDate ?? anomaly?.impactPerDay);
  if (impact >= 20000) return "Critical";
  if (impact >= 7500) return "High";
  if (impact >= 2500) return "Medium";
  return "Low";
};
