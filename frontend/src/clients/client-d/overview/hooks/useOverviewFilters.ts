import { useEffect, useState } from "react";
import type { ApiClient, Capabilities } from "../../../../services/apiClient";
import type {
  ApiLikeError,
  OverviewFilterOptions,
  UseOverviewFiltersResult,
} from "../types";

export const useOverviewFilters = (
  api: ApiClient | null,
  caps: Capabilities | null
): UseOverviewFiltersResult => {
  const [filterOptions, setFilterOptions] = useState<OverviewFilterOptions>({
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
          caps?.modules?.["overview"]?.enabled &&
          caps?.modules?.["overview"]?.endpoints?.["filters"];

        if (!endpointDef) return;

        const response = await api.call<OverviewFilterOptions | { data?: OverviewFilterOptions }>(
          "overview",
          "filters",
        );

        const data = (
          response && typeof response === "object" && "providers" in response
            ? response
            : response?.data
        ) as OverviewFilterOptions | undefined;

        if (active && data) {
          setFilterOptions(data);
        }
      } catch (error: unknown) {
        const apiError = error as ApiLikeError;
        if (apiError?.code !== "NOT_SUPPORTED") {
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
