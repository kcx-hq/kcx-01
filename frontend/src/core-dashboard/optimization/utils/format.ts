export const formatCurrency = (val, currency = "USD") => {
  const format = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  if (val === null || val === undefined || Number.isNaN(val)) return format(0);

  const num =
    typeof val === "string"
      ? parseFloat(val.replace(/[^\d.-]/g, ""))
      : Number(val);

  if (!Number.isFinite(num)) return format(0);
  return format(num);
};

export const formatNumber = (val, digits = 2) => {
  const num = typeof val === "string" ? parseFloat(val) : Number(val);
  if (!Number.isFinite(num)) return "0.00";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num);
};

export const formatPercent = (val, digits = 2) => {
  const num = typeof val === "string" ? parseFloat(val) : Number(val);
  if (!Number.isFinite(num)) return "N/A";
  return `${formatNumber(num, digits)}%`;
};
