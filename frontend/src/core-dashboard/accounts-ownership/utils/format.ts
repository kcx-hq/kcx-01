export const formatCurrency = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || Number.isNaN(val)) return "$0.00";
  const num = typeof val === "string" ? parseFloat(val.replace(/[$,]/g, "")) : val;
  if (Number.isNaN(num)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};
