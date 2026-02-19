export const getPriorityColor = (priority) => {
  if (priority === "HIGH IMPACT") return "text-rose-700 bg-rose-50 border-rose-200";
  if (priority === "MEDIUM IMPACT") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-emerald-700 bg-emerald-50 border-emerald-200";
};

export const buildParamsFromFilters = (filters = {}) => {
  const params = {};
  if (filters.provider && filters.provider !== "All") params.provider = filters.provider;
  if (filters.service && filters.service !== "All") params.service = filters.service;
  if (filters.region && filters.region !== "All") params.region = filters.region;
  return params;
};
