import { useEffect, useMemo, useState } from "react";
import type { ApiClient, Capabilities } from "../../../../services/apiClient";
import type {
  ApiLikeError,
  DataQualityFilterOptions,
  UseClientCDataQualityFiltersResult,
} from "../types";

export const useClientCDataQualityFilters = (
  api: ApiClient | null,
  caps: Capabilities | null,
): UseClientCDataQualityFiltersResult => {
  const [rawOptions, setRawOptions] = useState<DataQualityFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !caps) return;

    let active = true;

    const fetchFilterOptions = async () => {
      try {
        const endpointDef =
          caps?.modules?.["dataQuality"]?.enabled &&
          caps?.modules?.["dataQuality"]?.endpoints?.["filters"];

        if (!endpointDef) return;

        const payload = await api.call<DataQualityFilterOptions>("dataQuality", "filters");
        if (active && payload) setRawOptions(payload);
      } catch (error: unknown) {
        const typedError = error as ApiLikeError;
        if (typedError?.code !== "NOT_SUPPORTED") {
          console.error("Failed to fetch data quality filter options:", error);
          setError(typedError.message || 'Failed to load filter options');
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

  const filterOptions = useMemo<DataQualityFilterOptions>(() => {
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
