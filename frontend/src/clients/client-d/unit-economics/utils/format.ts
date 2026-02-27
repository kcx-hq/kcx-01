type NumericLike = number | string | null | undefined;

export const fmtCurrency = (n: NumericLike) => {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(num);
};

export const fmtNumber = (n: NumericLike, digits = 2) => {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(num);
};

export const fmtPct = (n: NumericLike, digits = 2) => {
  const num = Number(n || 0);
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(digits)}%`;
};

export const fmtDateShort = (val: string | number | Date | null | undefined) => {
  if (!val) return "â€”";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

export const driftTone = (status: string | null | undefined) => {
  const s = String(status || "").toLowerCase();
  if (s === "critical") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (s === "warning") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
};
