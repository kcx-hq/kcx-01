import { useEffect, useState } from "react";

export function useCostFilters({ api, caps }) {
  const [filterOptions, setFilterOptions] = useState({});

  useEffect(() => {
    if (!api || !caps) return;

    let mounted = true;

    const fetchFilters = async () => {
      try {
        const res = await api.call("costAnalytics", "costFilters");
        const payload = res?.data ?? res;
        if (mounted && payload) setFilterOptions(payload);
      } catch (e) {
        if (e?.code !== "NOT_SUPPORTED") {
          console.error("Failed to fetch filter options:", e);
        }
      }
    };

    fetchFilters();
    return () => {
      mounted = false;
    };
  }, [api, caps]);

  return { filterOptions };
}
