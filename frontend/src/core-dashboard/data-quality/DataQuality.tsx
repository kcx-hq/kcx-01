import DataQualityView from "./DataQualityView";
import { useDataQuality } from "./hooks/useDataQuality";

const DataQuality = ({ filters, api, caps }) => {
  const isEnabled = Boolean(api && caps && caps.modules?.dataQuality?.enabled);

  const { loading, stats } = useDataQuality({ filters, api, caps });

  if (!isEnabled) return null;

  return <DataQualityView loading={loading} stats={stats} filters={filters} />;
};

export default DataQuality;
