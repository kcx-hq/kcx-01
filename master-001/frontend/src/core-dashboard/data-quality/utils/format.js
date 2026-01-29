// frontend/core/dashboards/overview/data-quality/utils/format.js
export const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);

export const getScoreColor = (s) =>
  s >= 90 ? "text-green-400" : s >= 70 ? "text-yellow-400" : "text-red-500";

export const getScoreBg = (s) =>
  s >= 90
    ? "bg-green-500/10 border-green-500/20"
    : s >= 70
    ? "bg-yellow-500/10 border-yellow-500/20"
    : "bg-red-500/10 border-red-500/20";
