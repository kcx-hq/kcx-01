import { useEffect, useMemo, useState } from "react";
import { Users, Settings, MapPin, Cloud } from "lucide-react";

export const useClientCCostAnalysisFilters = (api, caps) => {
  const [rawOptions, setRawOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!api || !caps) return;

    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const endpointDef = caps?.modules?.costAnalysis?.enabled &&
          caps?.modules?.costAnalysis?.endpoints?.costFilters;

        if (!endpointDef) return;

        // Use capabilities API - endpoint key is "costFilters"
        const res = await api.call("costAnalysis", "filters", {});
        console.log('Cost Analysis filter options response:', res);
        
        // ✅ unwrap { success, data }
        const payload = res?.data;

        console.log('Cost Analysis filter options payload:', payload);
        const data = payload?.data ?? payload;
        
        if (data) {
          setRawOptions(data);
        } else {
          throw new Error('No data received from filters endpoint');
        }
      } catch (err) {
        if (err?.code !== "NOT_SUPPORTED") {
          console.error('Failed to fetch cost analysis filters:', err);
          setError(err.message || 'Failed to load filter options');
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

  const filterOptions = useMemo(() => {
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
    const groupByOptions = rawOptions.groupByOptions || [
      { value: 'ServiceName', label: 'Service' },
      { value: 'RegionName', label: 'Region' },
      { value: 'ProviderName', label: 'Provider' },
      { value: 'Department', label: 'Department' }
    ];

    // Normalize filter arrays - ensure 'All' is present without duplicates
    const normalizeFilterArray = (arr) => {
      if (!Array.isArray(arr)) return ['All'];
      const filtered = arr.filter(item => item && item !== 'All');
      return ['All', ...filtered];
    };

    return {
      providers: normalizeFilterArray(rawOptions.providers),
      services: normalizeFilterArray(rawOptions.services),
      regions: normalizeFilterArray(rawOptions.regions),
      groupBy: groupByOptions.map(option => ({
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