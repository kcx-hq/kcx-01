export const getPriorityColor = (priority) => {
  if (priority === "HIGH IMPACT") return "text-red-400 bg-red-400/10 border-red-400/30";
  if (priority === "MEDIUM IMPACT") return "text-orange-400 bg-orange-400/10 border-orange-400/30";
  return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
};

export const buildParamsFromFilters = (filters = {}) => {
  const params = {};
  if (filters.provider && filters.provider !== "All") params.provider = filters.provider;
  if (filters.service && filters.service !== "All") params.service = filters.service;
  if (filters.region && filters.region !== "All") params.region = filters.region;
  return params;
};
