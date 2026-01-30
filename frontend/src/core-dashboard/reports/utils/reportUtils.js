export const buildReportParams = (filters = {}) => {
  const params = {};
  if (filters?.provider && filters.provider !== "All") params.provider = filters.provider;
  if (filters?.service && filters.service !== "All") params.service = filters.service;
  if (filters?.region && filters.region !== "All") params.region = filters.region;
  return params;
};

export const formatPeriod = (dateString) => {
  if (!dateString) return "Current Period";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "Current Period";
  }
};

export const getColorClasses = (color) => {
  const colors = {
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    green: "bg-green-500/10 border-green-500/30 text-green-400",
    yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  };
  return colors[color] || colors.blue;
};
