import DataQualityView from "./DataQualityView";
import { useDataQuality } from "./hooks/useDataQuality";

const DataQuality = ({ filters, api, caps }) => {
  if (!api || !caps || !caps.modules?.dataQuality?.enabled) return null;

  const { loading, stats } = useDataQuality({ filters, api, caps });

  return <DataQualityView loading={loading} stats={stats} filters={filters} />;
};

export default DataQuality;
