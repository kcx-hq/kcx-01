import DataQualityView from "./DataQualityView";
import type { GovernanceFilters } from "./types";
import type { ApiClient, Capabilities } from "../../services/apiClient";

interface DataQualityProps {
  filters?: GovernanceFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

const DataQuality = ({ filters, api, caps }: DataQualityProps) => {
  const isEnabled = Boolean(api && caps?.modules?.dataQuality?.enabled);
  if (!isEnabled) return null;

  return <DataQualityView filters={filters} api={api} caps={caps} />;
};

export default DataQuality;
