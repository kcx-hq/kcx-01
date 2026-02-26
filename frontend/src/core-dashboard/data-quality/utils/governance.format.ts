import type { RiskLevel } from "../types";

export const numberOrZero = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatPercent = (value: unknown, digits = 2): string =>
  `${numberOrZero(value).toFixed(digits)}%`;

export const formatSignedPercent = (value: unknown, digits = 2): string => {
  const n = numberOrZero(value);
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
};

export const formatCurrency = (
  value: unknown,
  currency = "USD",
  digits = 2
): string => {
  const amount = numberOrZero(value);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(digits)}`;
  }
};

export const formatDateTime = (value: string | null): string => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getRiskPillClass = (level: RiskLevel): string => {
  if (level === "red") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (level === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

export const getScoreToneClass = (score: number): string => {
  if (score >= 85) return "text-emerald-700";
  if (score >= 70) return "text-amber-700";
  return "text-rose-700";
};

export const getBarToneClass = (score: number): string => {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-rose-500";
};
