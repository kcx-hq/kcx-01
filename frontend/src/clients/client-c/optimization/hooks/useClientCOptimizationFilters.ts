import { useEffect, useMemo, useState } from "react";
import { Users, Settings, MapPin, Cloud } from "lucide-react";
import type { ApiClient, Capabilities } from "../../../../services/apiClient";
import type {
  ApiLikeError,
  ClientCOptimizationFilterOptions,
  ClientCOptimizationFiltersResult,
} from "../types";

export const useClientCOptimizationFilters = (
  api: ApiClient | null,
  caps: Capabilities | null,
): ClientCOptimizationFiltersResult => {
  const [rawOptions, setRawOptions] = useState<ClientCOptimizationFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !caps) return;

    let active = true;

    const fetchFilterOptions = async () => {
      try {
        const endpointDef =
          caps?.modules?.["optimization"]?.enabled &&
          caps?.modules?.["optimization"]?.endpoints?.["filters"];

        if (!endpointDef) return;

        const payload = await api.call<ClientCOptimizationFilterOptions>("optimization", "filters");
        if (active && payload) setRawOptions(payload);
      } catch (error: unknown) {
        const apiError = error as ApiLikeError;
        if (apiError?.code !== "NOT_SUPPORTED") {
          console.error("Failed to fetch optimization filter options:", error);
          setError(apiError.message || 'Failed to load filter options');
          // Provide fallback options on error
          setRawOptions({
            providers: ['All', 'AWS', 'Azure', 'GCP'],
            services: ['All', 'EC2', 'S3', 'RDS', 'Lambda', 'Compute Engine', 'Storage'],
            regions: ['All', 'us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchFilterOptions();

    return () => {
      active = false;
    };
  }, [api, caps]);

  const filterOptions = useMemo(() => {
    if (!rawOptions) {
      return {
        providers: ['All'],
        services: ['All'],
        regions: ['All'],
      };
    }

    return {
      providers: rawOptions.providers || ['All'],
      services: rawOptions.services || ['All'],
      regions: rawOptions.regions || ['All'],
    };
  }, [rawOptions]);

  return { filterOptions, loading, error };
};
