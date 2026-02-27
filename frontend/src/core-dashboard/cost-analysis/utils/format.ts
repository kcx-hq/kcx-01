export const formatCurrency = (val: number | null | undefined) => {
  if (val === undefined || val === null) return "$0.00";
  if (val > 0 && val < 0.01) return `$${val.toFixed(6)}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
};

export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};



