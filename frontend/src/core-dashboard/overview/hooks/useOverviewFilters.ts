import { useEffect, useState } from "react";
import {
  isObjectRecord,
  OverviewApiClient,
  OverviewCaps,
  OverviewFilterOptions,
} from "../types";

interface UseOverviewFiltersResult {
  filterOptions: OverviewFilterOptions;
}

const defaultFilterOptions: OverviewFilterOptions = {
  providers: ["All"],
  services: ["All"],
  regions: ["All"],
};

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const normalizeAllFirst = (values: string[]): string[] => {
  const cleaned = values.map((item) => item.trim()).filter(Boolean);
  const withoutAll = cleaned.filter((item) => item.toLowerCase() !== "all");
  return ["All", ...Array.from(new Set(withoutAll))];
};

const getFilterPayload = (response: unknown): OverviewFilterOptions | null => {
  if (!isObjectRecord(response)) return null;

  const providers = toStringArray(response["providers"]);
  const services = toStringArray(response["services"]);
  const regions = toStringArray(response["regions"]);

  if (!providers.length && !services.length && !regions.length) return null;

  return {
    providers: providers.length ? normalizeAllFirst(providers) : defaultFilterOptions.providers,
    services: services.length ? normalizeAllFirst(services) : defaultFilterOptions.services,
    regions: regions.length ? normalizeAllFirst(regions) : defaultFilterOptions.regions,
  };
};

const hasNotSupportedCode = (error: unknown): boolean =>
  isObjectRecord(error) && error.code === "NOT_SUPPORTED";

export const useOverviewFilters = (
  api: OverviewApiClient | null | undefined,
  caps: OverviewCaps | null | undefined
): UseOverviewFiltersResult => {
  const [filterOptions, setFilterOptions] = useState<OverviewFilterOptions>(defaultFilterOptions);

  useEffect(() => {
    if (!api || !caps) return;

    let active = true;

    const fetchFilterOptions = async (): Promise<void> => {
      try {
        const endpointDef =
          caps.modules?.overview?.enabled &&
          caps.modules?.overview?.endpoints?.filters;

        if (!endpointDef) return;

        const response = await api.call("overview", "filters");
        const payload = getFilterPayload(response);
        if (active && payload) setFilterOptions(payload);
      } catch (error: unknown) {
        if (!hasNotSupportedCode(error)) {
          console.error("Failed to fetch filter options:", error);
        }
      }
    };

    void fetchFilterOptions();

    return () => {
      active = false;
    };
  }, [api, caps]);

  return { filterOptions };
};

