import { useEffect, useState } from "react";

export const useOverviewFilters = (api, caps) => {
  const [filterOptions, setFilterOptions] = useState({
    providers: ["All"],
    services: ["All"],
    regions: ["All"],
  });

  useEffect(() => {
    if (!api || !caps) return;

    let active = true;

    const fetchFilterOptions = async () => {
      try {
        const endpointDef =
          caps?.modules?.overview?.enabled &&
          caps?.modules?.overview?.endpoints?.filters;

        if (!endpointDef) return;

        const res = await api.call("overview", "filters");
        console.log('Filter options response:', res);
        
        // ✅ unwrap { success, data }
        const payload = res?.data;
        const data = payload?.data ?? payload;
        
        if (active && data) setFilterOptions(data);
      } catch (error) {
        if (error?.code !== "NOT_SUPPORTED") {
          console.error("Failed to fetch filter options:", error);
        }
      }
    };

    fetchFilterOptions();

    return () => {
      active = false;
    };
  }, [api, caps]);

  return { filterOptions };
};