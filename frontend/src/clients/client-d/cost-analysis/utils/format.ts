export const formatCurrency = (val: number | string | null | undefined) => {
  const numeric = Number(val);
  if (!Number.isFinite(numeric)) return "$0.00";
  if (numeric > 0 && numeric < 0.01) return `$${numeric.toFixed(6)}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(numeric);
};

export const formatDate = (dateStr: string | Date | null | undefined) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
