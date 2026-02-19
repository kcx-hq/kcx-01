// frontend/core/dashboards/overview/data-quality/utils/format.js
export const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);

export const getScoreColor = (s) =>
  s >= 90 ? "text-emerald-700" : s >= 70 ? "text-amber-700" : "text-rose-700";

export const getScoreBg = (s) =>
  s >= 90
    ? "bg-emerald-50 border-emerald-200"
    : s >= 70
    ? "bg-amber-50 border-amber-200"
    : "bg-rose-50 border-rose-200";

