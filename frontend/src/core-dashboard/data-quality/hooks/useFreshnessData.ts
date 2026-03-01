import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { FreshnessStatusPayload } from "../types";
import { useGovernanceRequest } from "./useGovernanceRequest";

interface Params {
  api: ApiClient | null;
  caps: Capabilities | null;
  params: Record<string, string>;
}

export function useFreshnessData({ api, caps, params }: Params) {
  return useGovernanceRequest<FreshnessStatusPayload>({
    api,
    caps,
    endpoint: "freshness",
    params,
  });
}

export default useFreshnessData;
