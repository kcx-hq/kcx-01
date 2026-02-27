export const formatCurrency = (val: number | string | null | undefined) => {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return "$0.00";
  const num = typeof val === "string" ? parseFloat(val.replace(/[$,]/g, "")) : Number(val);
  if (Number.isNaN(num)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};
