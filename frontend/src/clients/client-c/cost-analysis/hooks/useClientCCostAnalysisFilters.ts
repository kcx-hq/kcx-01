import { useEffect, useMemo, useState } from "react";
import type { ApiClient, Capabilities } from "../../../../services/apiClient";
import type {
  ApiLikeError,
  ClientCCostAnalysisFilterOptions,
  GroupByOption,
  UseClientCCostAnalysisFiltersResult,
} from "../types";

interface RawCostAnalysisFilterOptions {
  providers?: string[];
  services?: string[];
  regions?: string[];
  groupByOptions?: GroupByOption[];
}

export const useClientCCostAnalysisFilters = (
  api: ApiClient | null,
  caps: Capabilities | null,
): UseClientCCostAnalysisFiltersResult => {
  const [rawOptions, setRawOptions] = useState<RawCostAnalysisFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !caps) return;

    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const endpointDef = caps?.modules?.["costAnalysis"]?.enabled &&
          caps?.modules?.["costAnalysis"]?.endpoints?.["costFilters"];

        if (!endpointDef) return;

        // Use capabilities API - endpoint key is "costFilters"
        const res = await api.call<RawCostAnalysisFilterOptions>("costAnalysis", "filters", {});
        console.log('Cost Analysis filter options response:', res);
        
        const data = res as RawCostAnalysisFilterOptions | undefined;
        
        if (data) {
          setRawOptions(data);
        } else {
          throw new Error('No data received from filters endpoint');
        }
      } catch (err: unknown) {
        const typedError = err as ApiLikeError;
        if (typedError?.code !== "NOT_SUPPORTED") {
          console.error('Failed to fetch cost analysis filters:', err);
          setError(typedError.message || 'Failed to load filter options');
          // Provide fallback options on error
          setRawOptions({
            providers: ['All', 'AWS', 'Azure', 'GCP'],
            services: ['All', 'EC2', 'S3', 'RDS', 'Lambda'],
            regions: ['All', 'us-east-1', 'us-west-2', 'eu-west-1'],
            groupByOptions: [
              { value: 'ServiceName', label: 'Service' },
              { value: 'RegionName', label: 'Region' },
              { value: 'ProviderName', label: 'Provider' },
              { value: 'Department', label: 'Department' }
            ]
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [api, caps]);

  const filterOptions = useMemo<ClientCCostAnalysisFilterOptions>(() => {
    if (!rawOptions) {
      return { 
        providers: ['All'], 
        services: ['All'], 
        regions: ['All'], 
        groupBy: [
          { value: 'ServiceName', label: 'Service' },
          { value: 'RegionName', label: 'Region' },
          { value: 'ProviderName', label: 'Provider' },
          { value: 'Department', label: 'Department' }
        ]
      };
    }

    // Normalize and enhance groupBy options from backend
    const groupByOptions: GroupByOption[] = rawOptions.groupByOptions || [
      { value: 'ServiceName', label: 'Service' },
      { value: 'RegionName', label: 'Region' },
      { value: 'ProviderName', label: 'Provider' },
      { value: 'Department', label: 'Department' }
    ];

    // Normalize filter arrays - ensure 'All' is present without duplicates
    const normalizeFilterArray = (arr: unknown): string[] => {
      if (!Array.isArray(arr)) return ['All'];
      const filtered = arr.filter((item): item is string => Boolean(item) && item !== 'All');
      return ['All', ...filtered];
    };

    return {
      providers: normalizeFilterArray(rawOptions.providers),
      services: normalizeFilterArray(rawOptions.services),
      regions: normalizeFilterArray(rawOptions.regions),
      groupBy: groupByOptions.map((option): GroupByOption => ({
        ...option,
        icon: option.value === 'Department' ? 'Users' : 
              option.value === 'ServiceName' ? 'Settings' :
              option.value === 'RegionName' ? 'MapPin' : 'Cloud'
      }))
    };
  }, [rawOptions]);

  return { 
    filterOptions, 
    loading, 
    error 
  };
};
