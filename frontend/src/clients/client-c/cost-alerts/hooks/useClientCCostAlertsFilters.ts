import { useEffect, useMemo, useState } from "react";
import type { ApiClient, Capabilities } from "../../../../services/apiClient";
import type {
  ApiLikeError,
  CostAlertsFilterOptions,
  UseClientCCostAlertsFiltersResult,
} from "../types";

export const useClientCCostAlertsFilters = (
  api: ApiClient | null,
  caps: Capabilities | null,
): UseClientCCostAlertsFiltersResult => {
  const [rawOptions, setRawOptions] = useState<CostAlertsFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !caps) return;

    let active = true;

    const fetchFilterOptions = async () => {
      try {
        const endpointDef =
          caps?.modules?.["costAlerts"]?.enabled &&
          caps?.modules?.["costAlerts"]?.endpoints?.["filters"];

        if (!endpointDef) return;

        const payload = await api.call<CostAlertsFilterOptions>("costAlerts", "filters");
        if (active && payload) setRawOptions(payload);
      } catch (error: unknown) {
        const typedError = error as ApiLikeError;
        if (typedError?.code !== "NOT_SUPPORTED") {
          console.error("Failed to fetch cost alerts filter options:", error);
          setError(typedError.message || 'Failed to load filter options');
          // Provide fallback options on error
          setRawOptions({
            providers: ['All', 'AWS', 'Azure', 'GCP'],
            services: ['All', 'EC2', 'S3', 'RDS', 'Lambda', 'Compute Engine', 'Storage'],
            regions: ['All', 'us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
            status: ['All', 'Active', 'Resolved', 'Suppressed'],
            severity: ['All', 'Critical', 'High', 'Medium', 'Low']
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

  const filterOptions = useMemo<CostAlertsFilterOptions>(() => {
    if (!rawOptions) {
      return {
        providers: ['All'],
        services: ['All'],
        regions: ['All'],
        status: ['All', 'Active', 'Resolved', 'Suppressed'],
        severity: ['All', 'Critical', 'High', 'Medium', 'Low'],
      };
    }

    return {
      providers: rawOptions.providers || ['All'],
      services: rawOptions.services || ['All'],
      regions: rawOptions.regions || ['All'],
      status: rawOptions.status || ['All', 'Active', 'Resolved', 'Suppressed'],
      severity: rawOptions.severity || ['All', 'Critical', 'High', 'Medium', 'Low'],
    };
  }, [rawOptions]);

  return { filterOptions, loading, error };
};
