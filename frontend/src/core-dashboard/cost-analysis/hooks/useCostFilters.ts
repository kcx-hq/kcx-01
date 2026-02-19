import { useEffect, useState } from "react";
import { useDashboardStore } from "../../../store/Dashboard.store";

export function useCostFilters({ api, caps }) {
  const [filterOptions, setFilterOptions] = useState({});

  const uploadIds = useDashboardStore((s) => s.uploadIds);
  const uploadIdsKey = (Array.isArray(uploadIds) ? uploadIds.join(",") : "") || "";

  useEffect(() => {
    if (!api || !caps) return;

    let mounted = true;

    const fetchFilters = async () => {
      try {
        const res = await api.call("costAnalysis", "costFilters");
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
  }, [api, caps, uploadIdsKey]);

  return { filterOptions };
}
