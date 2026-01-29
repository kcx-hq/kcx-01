// This hook is deprecated. Filter options are now derived dynamically from the data.
// Keeping file for backward compatibility but it's no longer used.

export const useClientCCostDriversFilters = () => {
  const filterOptions = {
    providers: ["All"],
    services: ["All"],
    regions: ["All"],
    groupBy: ["ServiceName", "Region", "Provider"],
  };

  return { filterOptions };
};