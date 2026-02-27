// This hook is deprecated. Filter options are now derived dynamically from the data.
// Keeping file for backward compatibility but it's no longer used.
import type { DynamicFilterOptions } from "../types";

export const useClientCCostDriversFilters = () => {
  const filterOptions: DynamicFilterOptions = {
    providers: ["All"],
    services: ["All"],
    regions: ["All"],
    groupBy: ["ServiceName", "Region", "Provider"],
  };

  return { filterOptions };
};
