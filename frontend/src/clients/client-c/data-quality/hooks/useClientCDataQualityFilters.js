import { useEffect, useMemo, useState } from "react";

export const useClientCDataQualityFilters = (api, caps) => {
  const [rawOptions, setRawOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!api || !caps) return;

    let active = true;

    const fetchFilterOptions = async () => {
      try {
        const endpointDef =
          caps?.modules?.dataQuality?.enabled &&
          caps?.modules?.dataQuality?.endpoints?.filters;

        if (!endpointDef) return;

        const res = await api.call("dataQuality", "filters");
        const payload = res?.data;
        if (active && payload) setRawOptions(payload);
      } catch (error) {
        if (error?.code !== "NOT_SUPPORTED") {
          console.error("Failed to fetch data quality filter options:", error);
          setError(error.message || 'Failed to load filter options');
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