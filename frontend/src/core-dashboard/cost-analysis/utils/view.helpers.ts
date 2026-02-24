export const normalizeOptions = (values: string[], fallback: string[]): string[] =>
  Array.from(new Set([...(Array.isArray(values) ? values : []), ...fallback]));

export const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

export const formatSignedPercent = (value: number): string => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

export const formatControlLabel = (value: string): string =>
  value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getPointNumeric = (point: unknown, key: string): number => {
  if (!point || typeof point !== "object") return 0;
  const value = (point as Record<string, unknown>)[key];
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const getPointString = (point: unknown, key: string): string => {
  if (!point || typeof point !== "object") return "";
  const value = (point as Record<string, unknown>)[key];
  return typeof value === "string" ? value : String(value ?? "");
};

export const getToneCardClass = (tone: "neutral" | "positive" | "warning" | "critical"): string => {
  if (tone === "positive") return "border-emerald-200 bg-emerald-50/60";
  if (tone === "warning") return "border-amber-200 bg-amber-50/60";
  if (tone === "critical") return "border-rose-200 bg-rose-50/60";
  return "border-slate-100 bg-white";
};

export const getToneBadgeClass = (tone: "neutral" | "positive" | "warning" | "critical"): string => {
  if (tone === "positive") return "bg-emerald-100 text-emerald-700";
  if (tone === "warning") return "bg-amber-100 text-amber-700";
  if (tone === "critical") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-600";
};
